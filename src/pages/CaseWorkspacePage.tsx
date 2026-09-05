import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { isApiError, service, type ActiveJob, type ApiErrorAction } from '@/api';
import { Drawer } from '@/components/ui/Drawer';
import { PrintableStatement, StatementDialog } from '@/features/documents/StatementDialog';
import { RebuttalDialog } from '@/features/documents/RebuttalDialog';
import { PrecedentDialog, ProcessDialog } from '@/features/workspace/dialogs/GroundDialogs';
import { ErrorDialog, SendConfirmDialog } from '@/features/workspace/dialogs/AlertDialogs';
import { VideoDialog } from '@/features/workspace/dialogs/VideoDialog';
import { sampleVideoUrl, VIDEO_LIMITS } from '@/config';
import type { Rebuttal, Statement } from '@/domain/document';
import type { ChatMessage, MessageBody } from '@/domain/message';
import type { Precedent, PrecedentDetail } from '@/domain/verdict';
import type { Case, VideoRef } from '@/domain/case';
import { Sidebar } from '@/features/cases/Sidebar';
import { ChatHeader } from '@/features/workspace/ChatHeader';
import { Composer } from '@/features/workspace/Composer';
import { MobileBar } from '@/features/workspace/MobileBar';
import { StatusPanel } from '@/features/workspace/StatusPanel';
import { MessageItem } from '@/features/workspace/messages/MessageItem';
import { chatReducer, emptyChat } from '@/store/chatReducer';
import { useCaseStore } from '@/store/caseStore';

/**
 * S4 작업 화면 — 라우트 하나가 h12~h37 + f01·f03·f04 + m05~m13을 흡수한다.
 * 화면이 여러 장인 게 아니라, 같은 셸 안에서 대화에 카드가 하나씩 더 붙는 것뿐이다.
 *
 * 왼쪽 HiSidebar(26화면 공유) · 가운데 대화 · 오른쪽 HiStatus(25화면 공유).
 * 폭 규칙은 시안 h09 주석 그대로다 — 1280 이상 둘 다 고정 / 1024~1280 현황판만 서랍 /
 * 1024 미만 둘 다 서랍. 서랍을 여는 단추는 대화 위 띠에 둔다.
 *
 * 9/3 축소 뒤 흐름은 한 줄기다:
 *   영상 → 분석(로딩) → 요약 글 → 글로 되묻기 → 판정 → 서류 → 발송.
 * 사실 고치기·재판정·상대 주장·변경 이력처럼 되돌아가는 길은 없다 (04 문서).
 */
let seq = 0;
const nextId = () => `m${++seq}`;
/** 답을 이만큼 기다려도 안 오면 기다림 표시를 걷는다 */
const REPLY_TIMEOUT_MS = 60_000;

/** 요청 없이 [다시 쓰기]만 눌렀을 때 서버에 보낼 말. 빈 문자열은 422다 (F-4) */
const REWRITE_ANY = '고칠 곳을 따로 적지 않았어요. 전체를 다시 정리해 주세요.';
const now = () => new Date().toISOString();

export function CaseWorkspacePage() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  /* 불러온 결과는 어느 사건 것인지까지 같이 들고 있는다. 사건을 바꾸는 순간
     이전 사건의 화면이 잠깐 비치거나 "없는 사건" 문구가 스치는 걸 막는다 */
  const [loaded, setLoaded] = useState<{ id: string; item: Case | null } | null>(null);
  const [chat, dispatch] = useReducer(chatReducer, emptyChat);
  /* 어느 화면에서 연 것인지까지 들고 있는다. 주소가 바뀌면 저절로 닫힌 셈이라
     effect로 닫을 필요가 없다.
     사건 id가 아니라 location.key로 묶는다 — [새 사건]이 빈 사건을 다시 쓰면
     같은 사건으로 다시 들어오는데, 그때도 열려 있던 서랍은 닫혀야 한다 */
  const { key: viewKey } = useLocation();
  const [drawer, setDrawer] = useState<{
    key: string;
    which: 'cases' | 'status' | 'statement' | 'rebuttal';
  } | null>(null);
  const openDrawer = drawer?.key === viewKey ? drawer.which : null;
  const [sending, setSending] = useState(false);
  /* 보내기 직전 한 번 더 묻는다 (h35) */
  const [confirmSend, setConfirmSend] = useState<Rebuttal | null>(null);
  /* P-5 오류 — 문구도 단추도 서버가 정한다 (명세 §2.3) */
  const [failure, setFailure] = useState<{
    title: string;
    hint: string;
    retryable: boolean;
    actions: ApiErrorAction[];
    retry: () => void;
  } | null>(null);
  /* F01 영상 뷰어 */
  const [playing, setPlaying] = useState<VideoRef | null>(null);
  /* 서류 전문. 카드에는 미리보기만 있어서 열 때 받아 둔다.
     어느 사건 것인지까지 같이 들고 있어서 사건을 바꾸면 저절로 무효가 된다 */
  const [fullDoc, setFullDoc] = useState<{ id: string; doc: Statement } | null>(null);
  const [fullRebuttal, setFullRebuttal] = useState<{ id: string; doc: Rebuttal } | null>(null);
  /* 팝업 2종도 서랍과 같은 규칙을 쓴다 */
  const [popup, setPopup] = useState<{
    key: string;
    which: 'precedent' | 'process';
    precedent?: Precedent;
  } | null>(null);
  const openPopup = popup?.key === viewKey ? popup.which : null;
  const show = (which: 'cases' | 'status' | 'statement' | 'rebuttal') =>
    setDrawer({ key: viewKey, which });
  /**
   * 사례 알맹이(글·그림). 열 때 받아 온다 — 오기 전에는 아는 것만 보여 준다.
   * 그림 주소의 서명은 10분짜리라 **열 때마다 새로 받는 지금 방식이 곧 갱신**이다.
   */
  const [precedentDoc, setPrecedentDoc] = useState<PrecedentDetail | null>(null);
  const pop = (which: 'precedent' | 'process', precedent?: Precedent) => {
    setPopup({ key: viewKey, which, precedent });
    if (which === 'precedent' && precedent) {
      setPrecedentDoc(null);
      void service
        .getPrecedent(caseId, precedent)
        .then(setPrecedentDoc)
        .catch(() => setPrecedentDoc(null));
    }
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickVideo = () => fileRef.current?.click();

  const reloadList = useCaseStore((s) => s.load);
  /* 콜백 안에서 최신 대화를 봐야 해서 거울을 하나 둔다 */
  const messagesRef = useRef(chat.messages);
  /**
   * 지금 서버에서 도는 작업. 단계는 내려오지 않고 종류 하나뿐이다 —
   * 분석·판정이면 대화에 로딩 카드를 세우고, 서류면 단추를 잠근다.
   */
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  /* 화면이 세워 둔 로딩 카드. 작업이 끝나면 치운다 */
  const loadingCardId = useRef<string | null>(null);
  /** 그 카드가 무슨 일을 기다리는 중인지. 일이 바뀌면 글자도 바뀌어야 한다 */
  const loadingPhase = useRef<ActiveJob['kind'] | null>(null);
  /* 내가 보낸 글에 대한 답을 기다리는 카드. Job이 없어서 activeJob으로는 못 잡는다 */
  const replyCardId = useRef<string | null>(null);
  /* 카드를 세우기 **전에** 답을 기다리기 시작한다 — 답이 POST 응답보다 먼저 올 수 있다 */
  const awaitingReply = useRef(false);
  /* 서버가 끝내 답하지 않는 경우가 있다. 점이 영영 도는 것보다 조용히 걷는 편이 낫다 */
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* 전문을 이미 청한 버전. 서버가 뒤처진 값을 주면 무한히 다시 청하게 된다 */
  const fetchedVersion = useRef<number | null>(null);
  /* 콜백 안에서 지금 서류가 있는지 봐야 한다 */
  const statementRef = useRef<Statement | null>(null);
  /* 지금 보고 있는 사건. 업로드·분석이 도는 동안 사건을 바꾸면
     끝난 결과가 남의 대화에 붙는다 — 그걸 막는 문지기다 */
  const activeCase = useRef(caseId);
  /* 예시 영상을 받아 오는 중. 연타로 두 번 올라가는 것을 막고 단추도 잠근다 */
  const [fetchingSample, setFetchingSample] = useState(false);

  /* 사건 한 장을 다시 읽는다. 이벤트가 끊겼을 때와 화면에 처음 들어올 때 쓴다 */
  const refresh = useCallback(async () => {
    const { item: fresh, activeJob: job } = await service.getCase(caseId);
    setLoaded({ id: caseId, item: fresh });
    setActiveJob(job);
    void reloadList();
    return fresh;
  }, [caseId, reloadList]);

  const dropReplyCard = useCallback(() => {
    awaitingReply.current = false;
    if (replyTimer.current !== null) {
      clearTimeout(replyTimer.current);
      replyTimer.current = null;
    }
    if (replyCardId.current === null) return;
    dispatch({ type: 'drop', id: replyCardId.current });
    replyCardId.current = null;
  }, []);

  /* 화면이 잠깐 세워 두는 카드 (업로드 중·분석 중). 서버 로그에는 남지 않는다 */
  const put = useCallback((body: MessageBody) => {
    const id = nextId();
    dispatch({ type: 'append', message: { ...body, id, at: now() } as ChatMessage });
    return id;
  }, []);

  /* 올라가던 카드를 진행 카드 자리에 그대로 세워 둔다 */
  const showUploading = useCallback(
    (id: string, fileName: string, sizeBytes: number) =>
      dispatch({
        type: 'settle',
        message: { id, at: now(), role: 'ai', kind: 'uploading', fileName, sizeBytes, progress: 0 },
      }),
    [],
  );

  /* 업로드 예외처리는 범위 밖이다 (04 문서 C4). 다만 올라가던 카드를 그대로 두면
     영영 도는 것처럼 보여서, 한 줄로 사정을 알리고 다시 올릴 수 있게 둔다.
     손으로 고른 영상과 예시 영상이 **같은 문구로** 실패하도록 한 곳에 둔다 */
  const failUpload = useCallback(
    (id: string) =>
      dispatch({
        type: 'settle',
        message: {
          id,
          at: now(),
          role: 'ai',
          kind: 'text',
          text: '영상을 올리지 못했어요. 다시 한 번 올려 주시겠어요?',
        },
      }),
    [],
  );

  /**
   * 업로드 — 진행 카드만 화면이 세운다.
   * 올라가고 나면 **첨부 카드는 서버가 만들어 보내 준다.** 여기서는 세워 둔 카드를 치울 뿐이다.
   * 설명이 이미 있으면 서버가 분석까지 알아서 시작한다 (기능명세 1.4).
   *
   * `cardId`를 주면 이미 세워 둔 카드를 이어서 쓴다 — 예시 영상은 파일을 받아 오는 동안
   * 먼저 카드를 세워 두기 때문이다. 그 뒤로는 손으로 고른 것과 완전히 같은 길이다.
   */
  const startUpload = useCallback(
    async (file: File, cardId?: string) => {
      const id =
        cardId ??
        put({
          role: 'ai',
          kind: 'uploading',
          fileName: file.name,
          sizeBytes: file.size,
          progress: 0,
        });

      try {
        await service.uploadVideo(caseId, file, (p) => {
          if (activeCase.current === caseId) dispatch({ type: 'progress', id, percent: p });
        });
        if (activeCase.current !== caseId) return;
        dispatch({ type: 'drop', id });
        await refresh();
      } catch {
        if (activeCase.current !== caseId) return;
        failUpload(id);
      }
    },
    [caseId, failUpload, put, refresh],
  );

  /**
   * 예시 영상 — `public/sample/`에 있는 파일을 받아 손으로 고른 것과 **같은 길로** 흘린다.
   *
   * 누른 즉시 업로드 카드를 세운다. 파일을 받아 오는 동안은 진행률이 0에 머무는데,
   * 손으로 고를 때도 첫 진행 신호가 올 때까지 0이라 보이는 모양이 같다.
   * 못 받으면 업로드 실패와 같은 문구를 낸다 — 예전에는 아무 일도 없는 것처럼 조용히 끝났다.
   */
  const pickSample = useCallback(
    async (fileName: string) => {
      if (fetchingSample) return;
      setFetchingSample(true);
      const id = put({ role: 'ai', kind: 'uploading', fileName, sizeBytes: 0, progress: 0 });

      let file: File;
      try {
        const res = await fetch(sampleVideoUrl(fileName));
        if (!res.ok) throw new Error(`예시 영상을 받지 못했어요 (${res.status})`);
        /* 크기는 헤더가 먼저 알려 준다 — 본문을 다 받기 전에 카드에 채워 넣는다 */
        const total = Number(res.headers.get('content-length'));
        if (total > 0) showUploading(id, fileName, total);
        const blob = await res.blob();
        file = new File([blob], fileName, { type: blob.type || 'video/mp4' });
      } catch {
        if (activeCase.current === caseId) failUpload(id);
        return;
      } finally {
        /* 파일만 받으면 단추는 풀어 준다. 업로드 중 잠금은 손으로 고를 때도 없다 */
        setFetchingSample(false);
      }

      /* 받는 사이에 사건을 떠났으면 남의 대화에 붙이지 않는다 */
      if (activeCase.current !== caseId) {
        dispatch({ type: 'drop', id });
        return;
      }
      showUploading(id, fileName, file.size);
      await startUpload(file, id);
    },
    [caseId, failUpload, fetchingSample, put, showUploading, startUpload],
  );

  /**
   * 경위서 전문 — 카드에는 미리보기 줄만 온다. 전문은 열 때 따로 받는다 (명세 F-3).
   * 다시 쓰면 버전이 오르므로 열 때마다 새로 받는다.
   */
  const openStatement = useCallback(async () => {
    try {
      const full = await service.getStatement(caseId);
      if (activeCase.current !== caseId) return;
      setFullDoc({ id: caseId, doc: full });
    } catch {
      /* 못 받으면 카드가 아는 만큼만 보여 준다 */
    }
    setDrawer({ key: viewKey, which: 'statement' });
  }, [caseId, viewKey]);

  /**
   * 서버가 준 실패를 그대로 화면에 옮긴다. 문구를 새로 만들지 않는다.
   * 규격 밖 실패(연결 끊김 등)에만 우리 문장을 쓴다.
   */
  const showFailure = useCallback((e: unknown, retry: () => void) => {
    setFailure(
      isApiError(e)
        ? {
            title: e.body.title,
            hint: e.body.message,
            retryable: e.body.retryable,
            actions: e.body.actions,
            retry,
          }
        : {
            title: '문제가 생겼어요',
            hint: '연결이 끊겼어요. 잠시 후 다시 시도해 주세요.',
            retryable: true,
            actions: [],
            retry,
          },
    );
  }, []);

  /**
   * 서류 만들기 — 셋 다 "청하고 끝"이다. 202만 오고 **카드는 이벤트로 들어온다.**
   * 도는 동안은 activeJob이 서 있어서 단추가 잠긴다.
   */
  /**
   * 서류 작업을 청하고 **누른 즉시 잠근다.**
   *
   * 서버는 202만 주고 진행 상태는 `case.updated`로 뒤늦게 온다. 그때까지 기다리면
   * 누른 티가 안 나는데, 서류 작업은 로딩 카드도 세우지 않아서(04 문서 — h31 제외)
   * 알릴 곳이 단추뿐이다. 그래서 activeJob을 먼저 세우고, 실패하면 도로 내린다.
   */
  const runDocJob = useCallback(
    async (kind: 'report' | 'rebuttal', call: () => Promise<void>) => {
      /* [다시 시도]가 같은 길을 그대로 다시 타도록 안쪽에 둔다 */
      const go = async () => {
        /* 분석·판정이 돌고 있으면 그대로 둔다 — 덮어쓰면 그쪽 로딩 카드가 사라진다.
           사건당 Job은 하나뿐이라(명세 §2.6) 서버도 어차피 받아 주지 않는다 */
        setActiveJob((cur) => cur ?? { kind });
        try {
          await call();
        } catch (e) {
          if (activeCase.current !== caseId) return;
          /* 내가 세운 것만 내린다 */
          setActiveJob((cur) => (cur?.kind === kind ? null : cur));
          showFailure(e, () => void go());
        }
      };
      await go();
    },
    [caseId, showFailure],
  );

  const createStatement = useCallback(async () => {
    /* 판정 카드와 현황판 두 곳에서 부른다. 이미 있으면 새로 만들지 않고 연다 */
    if (statementRef.current) {
      void openStatement();
      return;
    }
    await runDocJob('report', () => service.createStatement(caseId));
  }, [caseId, openStatement, runDocJob]);

  /**
   * 다시 쓰기 — 대화는 앞으로만 가므로 고쳐 끼우지 않고 새 버전 카드가 아래에 붙는다.
   *
   * **빈 요청은 서버가 받지 않는다** — F-4는 `request`를 1~500자로 받고,
   * 빈 문자열이면 422(`VALIDATION_FAILED`)로 돌려보낸다. 그런데 요청을 적을 칸이
   * 있는 곳은 전문 모달(h30)뿐이고, 채팅 카드(h26)의 단추에는 아예 없다.
   * 그냥 누른 것은 "특별히 고칠 데는 없고 한 번 더 써 달라"는 뜻이므로,
   * 그 말을 채워서 보낸다. 빈 칸으로 둔 모달도 같은 길을 탄다.
   */
  const rewriteStatement = useCallback(
    async (instruction?: string) =>
      runDocJob('report', () =>
        service.reviseStatement(caseId, instruction?.trim() || REWRITE_ANY),
      ),
    [caseId, runDocJob],
  );

  /* 잠겨 있으면 서버가 [사건경위서 먼저 만들기]까지 지정해 준다 (G-1) */
  const createRebuttal = useCallback(
    async () => runDocJob('rebuttal', () => service.createRebuttal(caseId)),
    [caseId, runDocJob],
  );

  const sendRebuttal = useCallback(
    async (draft: Rebuttal) => {
      setSending(true);
      try {
        /* 보내기 전 고친 내용을 먼저 저장하고, 최종 내용은 서버가 읽는다 */
        await service.updateRebuttal(caseId, draft);
        await service.sendRebuttal(caseId);
        setConfirmSend(null);
        setDrawer(null);
        await refresh();
      } catch (e) {
        /* 쓴 내용과 첨부는 그대로 두고 확인 창으로 돌려보낸다 (h36) */
        showFailure(e, () => {
          setFailure(null);
          setConfirmSend(draft);
        });
      } finally {
        setSending(false);
      }
    },
    [caseId, refresh, showFailure],
  );

  /**
   * 입력창 전용. 되물음에 대한 답도 이 길로 간다 — 답변 전용 API는 없다.
   * 돌려받는 건 내가 친 글 한 장뿐이고, AI 답과 판정 카드는 이벤트로 들어온다.
   */
  /**
   * 글 보내기 — 내가 친 글 한 장만 돌아오고 **답은 SSE로 따로 온다** (명세 C-2).
   *
   * 그 사이가 비어 있으면 답하는 중인지 알 수 없다. 되물음·답변은 Job을 만들지
   * 않으므로(명세 §1.1 — Agent 호출 뒤 바로 SSE) activeJob으로는 잡히지 않는다.
   * 그래서 여기서 직접 기다림 카드를 세우고, 답이 오면 치운다.
   */
  const sendText = useCallback(
    async (text: string) => {
      /* [다시 시도]가 같은 길을 그대로 다시 타도록 안쪽에 둔다 */
      const go = async () => {
        /* 기다림은 보내기 **전에** 시작한다. 답이 POST 응답보다 먼저 도착하면
           dropReplyCard가 이 깃발을 내려, 뒤늦게 카드를 세우지 않는다 */
        awaitingReply.current = true;
        let mine;
        try {
          mine = await service.sendMessage(caseId, text);
        } catch (e) {
          if (activeCase.current !== caseId) return;
          dropReplyCard();
          showFailure(e, () => void go());
          return;
        }
        if (activeCase.current !== caseId) return;
        dispatch({ type: 'append', message: mine });

        if (!awaitingReply.current || replyCardId.current !== null) return;
        const id = nextId();
        replyCardId.current = id;
        dispatch({
          type: 'append',
          message: { id, at: now(), role: 'ai', kind: 'analyzing', phase: 'reply' },
        });
        /* 서버가 끝내 답하지 않아도 점이 영영 돌지는 않게 한다 (04 문서에 실패 화면은 없다) */
        replyTimer.current = setTimeout(() => {
          if (activeCase.current === caseId) dropReplyCard();
        }, REPLY_TIMEOUT_MS);
      };
      await go();
    },
    [caseId, dropReplyCard, showFailure],
  );

  /**
   * 사건에 처음 들어올 때 한 번 읽고, **읽고 나서** 채널에 붙는다.
   * 순서가 뒤집히면 먼저 도착한 카드를 뒤늦은 reset이 덮어 버린다.
   * 이후 갱신은 전부 이벤트로 받는다 — 폴링하지 않는다 (명세 §6).
   */
  useEffect(() => {
    let alive = true;
    let stop: (() => void) | null = null;
    activeCase.current = caseId;
    loadingCardId.current = null;
    loadingPhase.current = null;
    dropReplyCard();
    fetchedVersion.current = null;

    Promise.all([service.getCase(caseId), service.listMessages(caseId)])
      .then(([{ item: c, activeJob: job }, past]) => {
        if (!alive) return;
        setLoaded({ id: caseId, item: c });
        setActiveJob(job);
        /* 지난 대화를 그대로 되살린다. 아직 아무 말도 오가지 않은 사건은
           접수 안내 한 장으로 시작한다 (h12) */
        dispatch({
          type: 'reset',
          messages: past.length ? past : [{ id: nextId(), at: now(), role: 'ai', kind: 'guide' }],
        });

        stop = service.subscribe(caseId, {
          /* 같은 카드가 두 번 오는 것은 reducer가 id로 막는다 */
          message: (message) => {
            /* 답이 도착했다 — 기다림 카드를 먼저 치워야 새 카드가 맨 아래에 붙는다 */
            if (message.role === 'ai') dropReplyCard();
            dispatch({ type: 'append', message });
          },
          /* 다시 쓴 서류는 제자리에서 바꾸지 않고 대화 끝으로 옮긴다 —
             저 위에서 조용히 바뀌면 다시 쓴 티가 안 난다 (명세 F-4는 message.updated로 온다) */
          messageUpdated: (message) =>
            dispatch({
              type:
                message.kind === 'statementDraft' || message.kind === 'rebuttalDraft'
                  ? 'revise'
                  : 'settle',
              message,
            }),
          caseUpdated: (item, activeJobNow) => {
            setLoaded({ id: caseId, item });
            setActiveJob(activeJobNow);
            void reloadList();
          },
          /* 채널이 끊겼고 되살리지 못했다 — 사건과 대화를 다시 읽어 맞춘다 */
          lost: () => {
            void refresh();
            void service.listMessages(caseId).then((again) => {
              if (activeCase.current === caseId && again.length) {
                dispatch({ type: 'reset', messages: again });
              }
            });
          },
        });
        /* 읽는 사이에 사건을 떠났으면 붙자마자 뗀다 */
        if (!alive) {
          stop();
          stop = null;
        }
      })
      .catch(() => {
        if (alive) setLoaded({ id: caseId, item: null });
      });

    return () => {
      alive = false;
      stop?.();
    };
  }, [caseId, dropReplyCard, refresh, reloadList]);

  /**
   * 일이 도는 동안 기다림 카드 한 장을 세운다 (04 문서 C6 — 단계 표시는 없다).
   * 서버가 단계를 내려보내지 않으므로 화면이 activeJob만 보고 세웠다 치운다.
   *
   * 서류 작업(report·rebuttal)도 세운다. 예전에는 단추 글자만 바뀌었는데,
   * 그 단추는 저 위 카드에 있어서 대화를 보고 있으면 무슨 일이 도는지 몰랐다.
   * 단추 잠금은 그대로 둔다 — 두 번 청하는 것은 여전히 막아야 한다.
   */
  useEffect(() => {
    const phase = activeJob?.kind ?? null;
    if (phase === loadingPhase.current) return;

    /* 일이 바뀌었으면 서 있던 카드부터 내린다 — 안 내리면 분석이 끝나고 판정이
       도는 동안에도 "영상을 분석하고 있어요"가 그대로 남는다 */
    if (loadingCardId.current !== null) {
      dispatch({ type: 'drop', id: loadingCardId.current });
      loadingCardId.current = null;
    }
    if (phase) {
      /* 답 대신 다른 일이 시작된 경우다. 기다림 카드가 두 장 서지 않게 먼저 치운다 */
      dropReplyCard();
      const id = nextId();
      loadingCardId.current = id;
      dispatch({
        type: 'append',
        message: { id, at: now(), role: 'ai', kind: 'analyzing', phase },
      });
    }
    loadingPhase.current = phase;
  }, [activeJob, dropReplyCard]);

  /** 이 사건의 전문을 받아 뒀나. 아니면 카드가 아는 만큼만 보여 준다 */
  const statementFull = fullDoc?.id === caseId ? fullDoc.doc : null;
  const rebuttalFull = fullRebuttal?.id === caseId ? fullRebuttal.doc : null;

  /** 서류 작업이 도는 동안은 [다시 쓰기]·[만들기]를 잠근다 */
  const rewriting = activeJob?.kind === 'report';

  /**
   * PDF — 서버가 만들어 준다. 목은 인쇄 CSS로 대신한다.
   * 어느 쪽이든 html2canvas는 쓰지 않는다 (한글이 이미지로 뭉개진다).
   */
  /**
   * 영상 뷰어 — 카드에는 이름·길이만 있고 재생 주소는 없다 (명세 §4.4).
   * 열면서 받아 온다. 서명이 붙어 있고 10분이면 만료돼서 미리 받아 둘 수도 없다.
   */
  const openVideo = useCallback(
    async (video: VideoRef) => {
      setPlaying(video);
      try {
        const full = await service.getVideo(video.id);
        if (activeCase.current !== caseId) return;
        setPlaying((cur) => (cur?.id === video.id ? { ...cur, ...full } : cur));
      } catch {
        /* 못 받아도 카드가 아는 만큼은 보여 준다 — 뷰어가 사정을 알린다 */
      }
    },
    [caseId],
  );

  /**
   * 반박의견서 — 카드에는 본문 미리보기(`bodyPreview`)만 온다. 전문은 열 때 받는다 (명세 G-2).
   * 받는이·접수번호·첨부 사정(25MB 초과 등)도 여기서 함께 온다.
   */
  const openRebuttal = useCallback(async () => {
    /* **받아 온 뒤에 연다.** 열어 놓고 나중에 갈아 끼우면, 그 사이 사용자가 적어 넣은
       받는이·접수번호·본문이 새 초안으로 덮여 지워진다 */
    try {
      const full = await service.getRebuttal(caseId);
      if (activeCase.current !== caseId) return;
      setFullRebuttal({ id: caseId, doc: full });
    } catch {
      /* 못 받으면 카드가 아는 만큼만 보여 준다 */
    }
    setDrawer({ key: viewKey, which: 'rebuttal' });
  }, [caseId, viewKey]);

  /**
   * PDF 받기 — 서버가 만들고(F-5) 인증을 붙여 받는다(F-6).
   * 실패 **화면**(h32)은 9/3에 빠졌지만, 명세 F-5가 서버 message를 기본 팝업으로
   * 띄우라고 못 박아 뒀다. 조용히 끝나면 이름만 .pdf인 파일이 떨어진 줄도 모른다.
   */
  const savePdf = useCallback(async () => {
    const run = async () => {
      try {
        await service.downloadStatementPdf(caseId, statementRef.current?.version ?? 1);
      } catch (e) {
        showFailure(e, () => void run());
      }
    };
    await run();
  }, [caseId, showFailure]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [chat.messages.length]);

  /* 화면이 넓어져 사이드바·현황판이 붙박이가 되면 서랍은 남아 있을 이유가 없다.
     열어 둔 채로 창을 넓히면 같은 것이 두 번 보인다 */
  useEffect(() => {
    const sidebarFixed = window.matchMedia('(min-width: 1024px)');
    const statusFixed = window.matchMedia('(min-width: 1280px)');
    const sync = () =>
      setDrawer((open) => {
        if (!open) return open;
        if (open.which === 'cases' && sidebarFixed.matches) return null;
        if (open.which === 'status' && statusFixed.matches) return null;
        return open;
      });
    sidebarFixed.addEventListener('change', sync);
    statusFixed.addEventListener('change', sync);
    return () => {
      sidebarFixed.removeEventListener('change', sync);
      statusFixed.removeEventListener('change', sync);
    };
  }, []);

  const item = loaded?.id === caseId ? loaded.item : null;

  /* 서류는 사건이 아니라 대화에 실려 온다. 마지막 것이 지금 것이다 */
  const lastOf = <K extends ChatMessage['kind']>(kind: K) =>
    [...chat.messages].reverse().find((m): m is Extract<ChatMessage, { kind: K }> => m.kind === kind) ??
    null;
  const statement = lastOf('statementDraft')?.doc ?? null;
  const rebuttal = lastOf('rebuttalDraft')?.doc ?? null;
  /* 참고용 고지는 화면당 한 번(규칙 0.2). 판정·경위서 카드가 이미 달고 나온다 */
  const disclaimerCardId =
    [...chat.messages]
      .reverse()
      .find((m) => m.kind === 'verdict' || m.kind === 'statementDraft')?.id ?? null;

  /**
   * [영상 올리기]가 설 자리 — 화면 전체에서 딱 하나다.
   *
   * 단추를 다는 곳이 둘이라 겹쳤다: 접수 안내 카드(h12)와, 영상 없이 이야기부터
   * 시작했을 때 서버가 답에 붙여 보내는 단추(h13). 영상을 올리기 전까지는
   * **대화의 맨 끝**에 있는 AI 말 한 곳만 단추를 맡고, 나머지는 그리지 않는다.
   *
   * 올리고 나면 아무도 맡지 않는다 — 대화는 앞으로만 가므로(00 문서 6절)
   * 다 지난 자리에 단추가 남아 있을 이유가 없다.
   */
  const hasVideo =
    Boolean(item?.video) || chat.messages.some((m) => m.kind === 'video' || m.kind === 'uploading');
  const uploadCardId = hasVideo
    ? null
    : ([...chat.messages]
        .reverse()
        .find((m) => m.kind === 'guide' || (m.kind === 'text' && m.role === 'ai'))?.id ?? null);

  useEffect(() => {
    messagesRef.current = chat.messages;
  }, [chat.messages]);

  useEffect(() => {
    statementRef.current = statement;
  }, [statement]);

  /**
   * 다시 쓰기는 UPDATE가 아니라 **새 버전 INSERT**다 (명세 F-2). 끝나면 카드가 한 장 더 붙는다.
   * 그때 손에 든 전문(statementFull)은 이전 버전이라, 그대로 두면 전문 모달이
   * 계속 옛 글을 보여 준다 — 카드가 더 새것이면 그쪽을 보여 주고 전문은 다시 받아 온다.
   */
  /* **카드 doc에는 절이 없다** — 미리보기 문장만 온다(map.ts). 그래서 전문 자리에는
     늘 전문을 쓰고, 뒤처졌으면 아래 effect가 받아다 갈아 끼운다 */
  const statementShown = statementFull ?? statement;

  useEffect(() => {
    const version = statement?.version;
    if (version === undefined) return;
    if (statementFull && statementFull.version >= version) return;
    /* 같은 버전을 두 번 청하지 않는다 — 서버가 낮은 버전을 돌려주면
       statementFull이 갱신되지 않아 effect가 끝없이 다시 돈다 */
    if (fetchedVersion.current === version) return;
    fetchedVersion.current = version;

    let alive = true;
    service
      .getStatement(caseId)
      .then((full) => {
        if (alive && activeCase.current === caseId) setFullDoc({ id: caseId, doc: full });
      })
      .catch(() => {
        /* 다음에 열 때 다시 받는다 (openStatement가 열기 전에 받아 온다) */
      });
    return () => {
      alive = false;
    };
  }, [caseId, statement, statementFull]);

  const notFound = loaded?.id === caseId && loaded.item === null;

  if (notFound) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-bg-3 p-6">
        <p className="text-[15px] text-ink-3">사건을 찾지 못했어요.</p>
        <button
          type="button"
          onClick={() => navigate('/cases')}
          className="min-h-11 rounded-md px-4 text-[14px] font-medium text-brand hover:bg-bg-2"
        >
          사건 목록으로
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 인쇄할 때는 화면 껍데기를 통째로 감추고 서류만 남긴다 (html2canvas 금지) */}
      {statementShown && item && (
        <PrintableStatement doc={statementShown} title={item.title ?? '새 사건'} />
      )}
      <div className="flex h-dvh bg-bg-3 print:hidden">
      {/* 1024 이상에서만 붙박이. 그 아래는 왼쪽 서랍이 같은 부품을 쓴다 */}
      <div className="hidden h-full md:block">
        <Sidebar selectedId={caseId} />
      </div>

      {/* 파일 선택창은 여기 한 벌만 둔다. 입력 바의 [+]와 h12의 [영상 올리기]가 같이 쓴다 */}
      <input
        ref={fileRef}
        type="file"
        accept={VIDEO_LIMITS.accept.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          /* 같은 파일을 다시 골라도 change가 오도록 값을 비운다 */
          e.target.value = '';
          if (file) void startUpload(file);
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar
          item={item}
          onOpenCases={() => show('cases')}
          onOpenStatus={() => show('status')}
        />

        {/* 머리글은 스크롤 상자 밖이다. 대화를 아무리 내려도 어느 사건인지 안 사라진다.
            1024 미만에서는 대화 열을 가운데로 모은다 (h09 주석의 태블릿·모바일 규칙) */}
        {item && (
          <div className="flex-none px-4 pt-4 md:px-6 md:pt-6">
            <div className="mx-auto w-full max-w-140 md:mx-0 md:max-w-none">
              <ChatHeader item={item} />
            </div>
          </div>
        )}

        <div className="chat-scroll flex flex-1 flex-col px-4 pt-4 pb-4 md:px-6 md:pb-6">
          <div className="mx-auto flex w-full max-w-140 flex-col items-start gap-5 md:mx-0 md:max-w-none md:gap-7">
            {chat.messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                withDisclaimer={message.id === disclaimerCardId}
                showUpload={message.id === uploadCardId}
                actions={{
                  onPickVideo: pickVideo,
                  onPickSample: (file) => void pickSample(file),
                  sampleLoading: fetchingSample,
                  onOpenPrecedent: (p) => pop('precedent', p),
                  onCreateStatement: () => void createStatement(),
                  statementExists: statement !== null,
                  onOpenStatement: () => void openStatement(),
                  onPrintStatement: () => void savePdf(),
                  onRewriteStatement: () => void rewriteStatement(),
                  statementRewriting: rewriting,
                  onCreateRebuttal: () => void createRebuttal(),
                  onOpenRebuttal: () => void openRebuttal(),
                  onOpenProcess: () => pop('process'),
                  onOpenVideo: (video) => void openVideo(video),
                }}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* 시안대로 첫 말을 하기 전에만 사고 상황을 청한다 (h12 → h13 이후) */}
        <Composer
          onSend={(text) => void sendText(text)}
          onPickVideo={pickVideo}
          placeholder={
            chat.messages.some((m) => m.role === 'user')
              ? '메시지를 입력하세요'
              : '사고 상황을 설명해 주세요'
          }
        />
      </div>

      {/* 1280 이상에서만 붙박이 */}
      {item && (
        <div className="hidden h-full lg:block">
          <StatusPanel
            item={item}
            statement={statement}
            rebuttal={rebuttal}
            showDisclaimer={disclaimerCardId === null}
            onOpenStatement={() => (statement ? void openStatement() : void createStatement())}
            onOpenRebuttal={() => (rebuttal ? void openRebuttal() : void createRebuttal())}
          />
        </div>
      )}

      <Drawer
        open={openDrawer === 'cases'}
        onClose={() => setDrawer(null)}
        side="left"
        label="내 사건"
      >
        <Sidebar selectedId={caseId} width="w-75 sm:w-65" />
      </Drawer>

      <StatementDialog
        open={openDrawer === 'statement'}
        doc={statementShown}
        onRewrite={(instruction) => void rewriteStatement(instruction)}
        rewriting={rewriting}
        onClose={() => setDrawer(null)}
        onPrint={() => void savePdf()}
      />

      <RebuttalDialog
        open={openDrawer === 'rebuttal'}
        doc={rebuttalFull ?? rebuttal}
        /* 서류에 적힌 것이 먼저다. 없으면 사건이 아는 값으로 채운다 */
        claimNo={(rebuttalFull ?? rebuttal)?.claimNo ?? item?.claimNo ?? null}
        sending={sending}
        onClose={() => setDrawer(null)}
        onSend={(draft) => setConfirmSend(draft)}
      />

      <PrecedentDialog
        open={openPopup === 'precedent'}
        precedent={popup?.precedent ?? null}
        bodyText={precedentDoc?.bodyText ?? null}
        imageUrl={precedentDoc?.imageUrl ?? null}
        imageCaption={precedentDoc?.imageCaption ?? null}
        onClose={() => setPopup(null)}
      />
      <ProcessDialog open={openPopup === 'process'} onClose={() => setPopup(null)} />

      <SendConfirmDialog
        open={confirmSend !== null}
        draft={confirmSend}
        sending={sending}
        onBack={() => setConfirmSend(null)}
        onSend={() => confirmSend && void sendRebuttal(confirmSend)}
      />

      <VideoDialog open={playing !== null} video={playing} onClose={() => setPlaying(null)} />

      <ErrorDialog
        open={failure !== null}
        title={failure?.title ?? ''}
        hint={failure?.hint ?? ''}
        retryable={failure?.retryable}
        actions={failure?.actions}
        onClose={() => setFailure(null)}
        onRetry={() => failure?.retry()}
        onAction={(action) => {
          setFailure(null);
          if (action.type === 'retry_send') failure?.retry();
          if (action.type === 'create_report') void createStatement();
          if (action.type === 'go_case_list') navigate('/cases');
          if (action.type === 'go_login' || action.type === 'go_password_reset') navigate('/login');
        }}
      />

      <Drawer
        open={openDrawer === 'status'}
        onClose={() => setDrawer(null)}
        side="sheet"
        label="사건 현황판"
      >
        {item && (
          <StatusPanel
            item={item}
            statement={statement}
            rebuttal={rebuttal}
            showDisclaimer={disclaimerCardId === null}
            onOpenStatement={() => (statement ? void openStatement() : void createStatement())}
            onOpenRebuttal={() => (rebuttal ? void openRebuttal() : void createRebuttal())}
          />
        )}
      </Drawer>
      </div>
    </>
  );
}
