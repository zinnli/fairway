import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { api } from '@/api';
import { Drawer } from '@/components/ui/Drawer';
import { PrintableStatement, StatementDialog } from '@/features/documents/StatementDialog';
import { RebuttalDialog } from '@/features/documents/RebuttalDialog';
import { PrecedentDialog, ProcessDialog } from '@/features/workspace/dialogs/GroundDialogs';
import { ErrorDialog, SendConfirmDialog } from '@/features/workspace/dialogs/AlertDialogs';
import { VideoDialog } from '@/features/workspace/dialogs/VideoDialog';
import { sampleVideoUrl, VIDEO_LIMITS } from '@/config';
import type { Rebuttal, Statement } from '@/domain/document';
import type { ChatMessage, MessageBody } from '@/domain/message';
import type { Precedent } from '@/domain/verdict';
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
  /* P-5 오류 — 9/3 축소 뒤 남은 실패 경로는 발송(h36) 하나뿐이다 */
  const [failure, setFailure] = useState<{ title: string; hint: string; retry: () => void } | null>(
    null,
  );
  /* F01 영상 뷰어 */
  const [playing, setPlaying] = useState<VideoRef | null>(null);
  /* 팝업 2종도 서랍과 같은 규칙을 쓴다 */
  const [popup, setPopup] = useState<{
    key: string;
    which: 'precedent' | 'process';
    precedent?: Precedent;
  } | null>(null);
  const openPopup = popup?.key === viewKey ? popup.which : null;
  const show = (which: 'cases' | 'status' | 'statement' | 'rebuttal') =>
    setDrawer({ key: viewKey, which });
  const pop = (which: 'precedent' | 'process', precedent?: Precedent) =>
    setPopup({ key: viewKey, which, precedent });
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickVideo = () => fileRef.current?.click();

  const reloadList = useCaseStore((s) => s.load);
  const analyzing = useRef(false);
  /* 콜백 안에서 최신 대화를 봐야 해서 거울을 하나 둔다 */
  const messagesRef = useRef(chat.messages);
  /* AI가 되물어 놓은 상태인가. 그렇다면 다음에 치는 글이 그 질문의 답이다 */
  const awaiting = useRef(false);
  /* 콜백 안에서 지금 서류가 있는지 봐야 한다 */
  const statementRef = useRef<Statement | null>(null);
  /* 지금 보고 있는 사건. 업로드·분석이 도는 동안 사건을 바꾸면
     끝난 결과가 남의 대화에 붙는다 — 그걸 막는 문지기다 */
  const activeCase = useRef(caseId);
  /* 예시 영상을 받아 오는 중. 연타로 두 번 올라가는 것을 막고 단추도 잠근다 */
  const [fetchingSample, setFetchingSample] = useState(false);
  /* 경위서를 다시 쓰는 중. 진행 화면(h31)이 없어서 단추 잠금으로만 알린다 */
  const [rewriting, setRewriting] = useState(false);

  /* 목이 사건을 고친 뒤에는 현황판과 사이드바를 다시 읽어야 한다.
     방금 읽은 사건을 돌려준다 — 상태가 화면에 반영되기 전에 판단해야 할 때가 있다 */
  const refresh = useCallback(async () => {
    const fresh = await api.getCase(caseId);
    setLoaded({ id: caseId, item: fresh });
    void reloadList();
    return fresh;
  }, [caseId, reloadList]);

  /* 화면이 만든 카드를 대화에 쌓는다.
     keep을 켜면 로그에도 남긴다 — 목이 이미 로그에 넣은 카드는 꺼 둬야 두 번 쌓이지 않는다 */
  const say = useCallback(
    (body: MessageBody, keep = true) => {
      dispatch({ type: 'append', message: { ...body, id: nextId(), at: now() } as ChatMessage });
      if (keep) void api.appendMessage(caseId, body);
    },
    [caseId],
  );

  /* 더 물을 게 없으면 판정한다. 목이 판정 카드를 로그에 넣으므로 여기선 화면에만 붙인다 */
  const judgeNow = useCallback(async () => {
    const verdict = await api.judge(caseId);
    if (activeCase.current !== caseId) return;
    say({ role: 'ai', kind: 'verdict', verdict }, false);
    await refresh();
  }, [caseId, refresh, say]);

  /* 분석 중에는 단계를 보여 주지 않는다. 로딩 카드 하나가 끝난 모양으로 바뀔 뿐이다 */
  const startAnalyze = useCallback(async () => {
    if (analyzing.current) return;
    analyzing.current = true;

    const id = nextId();
    dispatch({ type: 'append', message: { id, at: now(), role: 'ai', kind: 'analyzing' } });

    try {
      const { summary, question } = await api.analyze(caseId);
      if (activeCase.current !== caseId) return;
      dispatch({
        type: 'settle',
        message: { id, at: now(), role: 'ai', kind: 'analyzing', done: true },
      });
      say({ role: 'ai', kind: 'text', text: summary }, false);
      if (question) {
        awaiting.current = true;
        say({ role: 'ai', kind: 'text', text: question }, false);
        await refresh();
      } else {
        await judgeNow();
      }
    } finally {
      analyzing.current = false;
      if (activeCase.current === caseId) await refresh();
    }
  }, [caseId, judgeNow, refresh, say]);

  const startUpload = useCallback(
    async (file: File) => {
      const id = nextId();
      dispatch({
        type: 'append',
        message: {
          id,
          at: now(),
          role: 'ai',
          kind: 'uploading',
          fileName: file.name,
          sizeBytes: file.size,
          progress: 0,
        },
      });

      try {
        const video = await api.uploadVideo(caseId, file, (p) => {
          if (activeCase.current === caseId) dispatch({ type: 'progress', id, percent: p });
        });
        if (activeCase.current !== caseId) return;
        dispatch({ type: 'settle', message: { id, at: now(), role: 'user', kind: 'video', video } });
        await refresh();
        /* 설명과 영상이 모이면 버튼 없이 분석이 시작된다. 설명이 없으면 먼저 청한다
           (기능명세 1.4 · 유저플로우 F1) */
        if (messagesRef.current.some((m) => m.role === 'user' && m.kind === 'text')) {
          void startAnalyze();
        } else {
          say({
            role: 'ai',
            kind: 'text',
            text: '영상 잘 받았어요. 사고 상황을 한두 줄만 알려 주시면 바로 분석을 시작할게요.',
          });
        }
      } catch {
        /* 업로드 예외처리는 범위 밖이다 (04 문서 C4). 다만 올라가던 카드를 그대로 두면
           영영 도는 것처럼 보여서, 한 줄로 사정을 알리고 다시 올릴 수 있게 둔다 */
        if (activeCase.current !== caseId) return;
        dispatch({
          type: 'settle',
          message: {
            id,
            at: now(),
            role: 'ai',
            kind: 'text',
            text: '영상을 올리지 못했어요. 다시 한 번 올려 주시겠어요?',
          },
        });
      }
    },
    [caseId, refresh, say, startAnalyze],
  );

  /* 예시 영상 — public/sample/에 있는 파일을 받아 진짜 고른 것처럼 같은 길로 흘린다.
     여기서 File을 만들어 두면 업로드부터는 손으로 고른 것과 구분되지 않는다.
     서버가 붙어도 이 길은 그대로다 (실제 업로드가 된다) */
  const pickSample = useCallback(
    async (fileName: string) => {
      if (fetchingSample) return;
      setFetchingSample(true);
      try {
        const res = await fetch(sampleVideoUrl(fileName));
        if (!res.ok) return;
        const blob = await res.blob();
        await startUpload(new File([blob], fileName, { type: blob.type || 'video/mp4' }));
      } catch {
        /* 예시 파일이 없거나 못 받은 경우. 화면은 그대로 두고 [영상 올리기]로 가면 된다 */
      } finally {
        setFetchingSample(false);
      }
    },
    [fetchingSample, startUpload],
  );

  const createStatement = useCallback(async () => {
    /* 판정 카드와 현황판 두 곳에서 부른다. 이미 있으면 새로 만들지 않고 연다 */
    if (statementRef.current) {
      setDrawer({ key: viewKey, which: 'statement' });
      return;
    }
    const doc = await api.createStatement(caseId);
    say({ role: 'ai', kind: 'statementDraft', doc }, false);
    await refresh();
  }, [caseId, refresh, say, viewKey]);

  /* 다시 쓰기 — 대화는 앞으로만 가므로 고쳐 끼우지 않고 새 버전 카드를 아래에 붙인다.
     현황판과 전문 창이 보는 statement는 마지막 statementDraft에서 나오니 함께 따라온다 */
  const rewriteStatement = useCallback(
    async (instruction?: string) => {
      if (rewriting) return;
      setRewriting(true);
      try {
        const doc = await api.rewriteStatement(caseId, instruction || undefined);
        if (activeCase.current !== caseId) return;
        say({ role: 'ai', kind: 'statementDraft', doc }, false);
        await refresh();
      } finally {
        setRewriting(false);
      }
    },
    [caseId, refresh, rewriting, say],
  );

  const createRebuttal = useCallback(async () => {
    const doc = await api.createRebuttal(caseId);
    say({ role: 'ai', kind: 'rebuttalDraft', doc }, false);
    await refresh();
    /* 만들자마자 보내기 창을 연다 — 만들기만 하고 끝내면 다음 수가 안 보인다 */
    setDrawer({ key: viewKey, which: 'rebuttal' });
  }, [caseId, refresh, say, viewKey]);

  const sendRebuttal = useCallback(
    async (draft: Rebuttal) => {
      setSending(true);
      try {
        const receipt = await api.sendRebuttal(caseId, draft);
        setConfirmSend(null);
        setDrawer(null);
        say({ role: 'ai', kind: 'sent', to: receipt.to }, false);
        say({ role: 'ai', kind: 'nextSteps' }, false);
        await refresh();
      } catch {
        /* 작성한 내용과 첨부는 그대로 둔다 (h36) */
        setFailure({
          title: '보내지 못했어요',
          hint: '메일 서버가 응답하지 않았어요. 작성한 내용과 첨부는 그대로 있으니, 잠시 후 다시 시도해 주세요.',
          /* 쓴 내용은 그대로 두고 확인 창으로 돌려보낸다 (h36) */
          retry: () => {
            setFailure(null);
            setConfirmSend(draft);
          },
        });
      } finally {
        setSending(false);
      }
    },
    [caseId, refresh, say],
  );

  const sendText = useCallback(
    async (text: string) => {
      /* 목이 로그에 남기므로 화면에만 붙인다 */
      say({ role: 'user', kind: 'text', text }, false);

      /* 되물어 둔 게 있으면 이 글이 그 답이다. 더 물을 게 남았으면 이어서 묻고,
         없으면 바로 판정한다 (유저플로우 F2) */
      if (awaiting.current) {
        const { question } = await api.answerQuestion(caseId, text);
        if (activeCase.current !== caseId) return;
        if (question) {
          say({ role: 'ai', kind: 'text', text: question }, false);
          await refresh();
        } else {
          awaiting.current = false;
          await judgeNow();
        }
        return;
      }

      await api.sendMessage(caseId, text);
      const fresh = await refresh();
      /* 영상이 먼저 와 있었다면 이 설명이 분석의 방아쇠가 된다 */
      if (fresh.video && fresh.stages.analysis === '대기') void startAnalyze();
    },
    [caseId, judgeNow, refresh, say, startAnalyze],
  );

  useEffect(() => {
    let alive = true;
    activeCase.current = caseId;
    awaiting.current = false;
    Promise.all([api.getCase(caseId), api.listMessages(caseId)])
      .then(([c, past]) => {
        if (!alive) return;
        setLoaded({ id: caseId, item: c });
        /* 지난 대화를 그대로 되살린다. 아직 아무 말도 오가지 않은 사건은
           접수 안내 한 장으로 시작한다 (h12) */
        dispatch({
          type: 'reset',
          messages: past.length ? past : [{ id: nextId(), at: now(), role: 'ai', kind: 'guide' }],
        });
        /* 분석은 끝났는데 판정 전이고 마지막 말이 AI 글이면, 그건 던져 둔 질문이다.
           이어서 치는 글이 그 답이 된다 (업로드 직후의 안내 글과 헷갈리면 안 된다) */
        const last = past[past.length - 1];
        awaiting.current =
          c.stages.analysis === '완료' &&
          c.verdict === null &&
          last?.role === 'ai' &&
          last.kind === 'text';
      })
      .catch(() => {
        if (alive) setLoaded({ id: caseId, item: null });
      });
    return () => {
      alive = false;
    };
  }, [caseId]);

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

  useEffect(() => {
    messagesRef.current = chat.messages;
  }, [chat.messages]);

  useEffect(() => {
    statementRef.current = statement;
  }, [statement]);

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
      {statement && item && (
        <PrintableStatement doc={statement} title={item.title ?? '새 사건'} />
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
                actions={{
                  onPickVideo: pickVideo,
                  onPickSample: (file) => void pickSample(file),
                  sampleLoading: fetchingSample,
                  onOpenPrecedent: (p) => pop('precedent', p),
                  onCreateStatement: () => void createStatement(),
                  onOpenStatement: () => show('statement'),
                  onPrintStatement: () => window.print(),
                  onRewriteStatement: () => void rewriteStatement(),
                  statementRewriting: rewriting,
                  onCreateRebuttal: () => void createRebuttal(),
                  onOpenRebuttal: () => show('rebuttal'),
                  onOpenProcess: () => pop('process'),
                  onOpenVideo: setPlaying,
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
            onOpenStatement={() => (statement ? show('statement') : void createStatement())}
            onOpenRebuttal={() => (rebuttal ? show('rebuttal') : void createRebuttal())}
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
        doc={statement}
        onRewrite={(instruction) => void rewriteStatement(instruction)}
        rewriting={rewriting}
        onClose={() => setDrawer(null)}
        onPrint={() => window.print()}
      />

      <RebuttalDialog
        open={openDrawer === 'rebuttal'}
        doc={rebuttal}
        claimNo={item?.claimNo ?? null}
        sending={sending}
        onClose={() => setDrawer(null)}
        onSend={(draft) => setConfirmSend(draft)}
      />

      <PrecedentDialog
        open={openPopup === 'precedent'}
        precedent={popup?.precedent ?? null}
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
        onClose={() => setFailure(null)}
        onRetry={() => failure?.retry()}
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
            onOpenStatement={() => (statement ? show('statement') : void createStatement())}
            onOpenRebuttal={() => (rebuttal ? show('rebuttal') : void createRebuttal())}
          />
        )}
      </Drawer>
      </div>
    </>
  );
}
