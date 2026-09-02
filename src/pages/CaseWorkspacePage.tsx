import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { api } from '@/api';
import { toApiError } from '@/api/error';
import { Drawer } from '@/components/ui/Drawer';
import { PrintableStatement, StatementDialog } from '@/features/documents/StatementDialog';
import { RebuttalDialog } from '@/features/documents/RebuttalDialog';
import {
  ChartDialog,
  HistoryDialog,
  PrecedentDialog,
  ProcessDialog,
} from '@/features/workspace/dialogs/GroundDialogs';
import { VIDEO_LIMITS } from '@/config';
import { ANALYZE_STEPS } from '@/domain/analysis';
import { FACT_LABEL, type Fact, type FactKey } from '@/domain/fact';
import { FACT_QUESTIONS } from '@/domain/questions';
import type { Rebuttal } from '@/domain/document';
import type { ChatMessage, Chip } from '@/domain/message';
import type { Precedent } from '@/domain/verdict';
import type { Case } from '@/domain/case';
import { Sidebar } from '@/features/cases/Sidebar';
import { ChatHeader } from '@/features/workspace/ChatHeader';
import { Composer } from '@/features/workspace/Composer';
import { MobileBar } from '@/features/workspace/MobileBar';
import { StatusPanel } from '@/features/workspace/StatusPanel';
import { MessageItem } from '@/features/workspace/messages/MessageItem';
import { particle } from '@/lib/format';
import { chatReducer, emptyChat } from '@/store/chatReducer';
import { useCaseStore } from '@/store/caseStore';

/**
 * S4 작업 화면 — 라우트 하나가 h12~h39 + f01~f04 + m05~m13을 흡수한다.
 * 화면이 40장인 게 아니라, 같은 셸 안에서 대화에 카드가 하나씩 더 붙는 것뿐이다.
 *
 * 왼쪽 HiSidebar(26화면 공유) · 가운데 대화 · 오른쪽 HiStatus(25화면 공유).
 * 폭 규칙은 시안 h09 주석 그대로다 — 1280 이상 둘 다 고정 / 1024~1280 현황판만 서랍 /
 * 1024 미만 둘 다 서랍. 서랍을 여는 단추는 대화 위 띠에 둔다.
 * (시안은 "머리글에" 두라고 하지만, 우리 머리글은 대화와 같이 스크롤돼서 밀려 올라간다)
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
  /* 팝업 4종도 같은 규칙을 쓴다 */
  const [rewriting, setRewriting] = useState(false);
  const [sending, setSending] = useState(false);
  const [popup, setPopup] = useState<{
    key: string;
    which: 'chart' | 'precedent' | 'history' | 'process';
    precedent?: Precedent;
  } | null>(null);
  const openPopup = popup?.key === viewKey ? popup.which : null;
  const show = (which: 'cases' | 'status' | 'statement' | 'rebuttal') =>
    setDrawer({ key: viewKey, which });
  const pop = (which: 'chart' | 'precedent' | 'history' | 'process', precedent?: Precedent) =>
    setPopup({ key: viewKey, which, precedent });
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickVideo = () => fileRef.current?.click();

  const reloadList = useCaseStore((s) => s.load);
  /* 업로드 취소와 분석 멈추기는 진행 중인 것 하나씩만 있다 */
  const uploadAbort = useRef<AbortController | null>(null);
  const analyzeStopped = useRef(false);
  const analyzing = useRef(false);
  /* 지금 도는 분석 카드 — 멈출 때 그 카드를 끝난 모양으로 바꿔야 한다 */
  const analyzingCard = useRef<string | null>(null);
  /* 콜백 안에서 최신 대화·사건을 봐야 해서 거울을 하나씩 둔다 */
  const messagesRef = useRef(chat.messages);
  const itemRef = useRef<Case | null>(null);
  /* 보기 없이 되물은 항목 — 다음에 치는 글이 그 항목의 답이 된다 */
  const pendingFact = useRef<FactKey | null>(null);
  /* 지금 보고 있는 사건. 업로드·분석이 도는 동안 사건을 바꾸면
     끝난 결과가 남의 대화에 붙는다 — 그걸 막는 문지기다 */
  const activeCase = useRef(caseId);

  /* 목이 사건을 고친 뒤에는 현황판과 사이드바를 다시 읽어야 한다 */
  const refresh = useCallback(async () => {
    const fresh = await api.getCase(caseId);
    setLoaded({ id: caseId, item: fresh });
    void reloadList();
  }, [caseId, reloadList]);

  const startAnalyze = useCallback(async () => {
    if (analyzing.current) return;
    analyzing.current = true;
    analyzeStopped.current = false;

    const id = nextId();
    analyzingCard.current = id;
    dispatch({
      type: 'append',
      message: { id, at: now(), role: 'ai', kind: 'analyzing', step: ANALYZE_STEPS[0].doing },
    });

    try {
      for await (const event of api.analyze(caseId)) {
        if (analyzeStopped.current || activeCase.current !== caseId) break;
        if (event.type === 'step') dispatch({ type: 'step', id, label: event.label });
        if (event.type === 'facts') {
          dispatch({
            type: 'settle',
            message: { id, at: now(), role: 'ai', kind: 'analyzing', step: '', done: true },
          });
          dispatch({
            type: 'append',
            message: { id: nextId(), at: now(), role: 'ai', kind: 'facts', facts: event.facts },
          });
        }
        if (event.type === 'failed') {
          dispatch({
            type: 'append',
            message: {
              id: nextId(),
              at: now(),
              role: 'ai',
              kind: 'error',
              code: 'analyze/failed',
              hint: event.hint,
            },
          });
        }
      }
    } catch (e) {
      const err = toApiError(e, 'analyze/failed');
      dispatch({
        type: 'append',
        message: { id: nextId(), at: now(), role: 'ai', kind: 'error', code: err.code, hint: err.message },
      });
    } finally {
      analyzing.current = false;
      analyzingCard.current = null;
      await refresh();
    }
  }, [caseId, refresh]);

  const startUpload = useCallback(
    async (file: File) => {
      const id = nextId();
      let percent = 0;
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
          state: 'uploading',
        },
      });

      const abort = new AbortController();
      uploadAbort.current = abort;

      try {
        const video = await api.uploadVideo(
          caseId,
          file,
          (p) => {
            percent = p;
            if (activeCase.current === caseId) dispatch({ type: 'progress', id, percent: p });
          },
          abort.signal,
        );
        if (activeCase.current !== caseId) return;
        dispatch({
          type: 'settle',
          message: { id, at: now(), role: 'user', kind: 'video', video },
        });
        await refresh();
        /* 설명과 영상이 모이면 버튼 없이 분석이 시작된다. 설명이 없으면 먼저 청한다
           (기능명세 1.4 · 유저플로우 F1) */
        if (messagesRef.current.some((m) => m.role === 'user' && m.kind === 'text')) {
          void startAnalyze();
        } else {
          dispatch({
            type: 'append',
            message: {
              id: nextId(),
              at: now(),
              role: 'ai',
              kind: 'text',
              text: '영상 잘 받았어요. 사고 상황을 한두 줄만 알려 주시면 바로 분석을 시작할게요.',
            },
          });
        }
      } catch (e) {
        if (activeCase.current !== caseId) return;
        const err = toApiError(e, 'upload/network');
        const canceled = err.code === 'upload/canceled';
        dispatch({
          type: 'settle',
          message: {
            id,
            at: now(),
            role: 'ai',
            kind: 'uploading',
            fileName: file.name,
            sizeBytes: file.size,
            progress: percent,
            state: canceled ? 'canceled' : 'failed',
            note: canceled
              ? `업로드를 취소했어요 · ${Math.round((file.size * percent) / 100 / 1024 / 1024)}MB에서 중단`
              : '올리지 못했어요',
          },
        });
        dispatch({
          type: 'append',
          message: { id: nextId(), at: now(), role: 'ai', kind: 'error', code: err.code, hint: err.message },
        });
      } finally {
        uploadAbort.current = null;
      }
    },
    [caseId, refresh, startAnalyze],
  );

  /* 멈추면 그대로 두지 않고 왜 멈췄는지와 다음 수를 남긴다 (규칙 0.7) */
  const stopAnalyze = useCallback(() => {
    analyzeStopped.current = true;
    /* 멈춘 카드는 계속 "…하고 있어요"로 두지 않는다 */
    const card = analyzingCard.current;
    if (card) {
      dispatch({
        type: 'settle',
        message: { id: card, at: now(), role: 'ai', kind: 'analyzing', step: '', done: true },
      });
    }
    dispatch({
      type: 'append',
      message: {
        id: nextId(),
        at: now(),
        role: 'ai',
        kind: 'error',
        code: 'analyze/failed',
        hint: '분석을 멈췄어요. [다시 시도]를 누르면 처음부터 다시 봐요.',
      },
    });
  }, []);

  /* 아직 확인 안 된 항목을 하나 골라 되묻는다. 보기가 없는 항목은 글로 답하게 둔다 */
  const ask = useCallback((fact: Fact) => {
    const question = FACT_QUESTIONS[fact.key];
    pendingFact.current = question ? null : fact.key;
    dispatch({
      type: 'append',
      message: question
        ? {
            id: nextId(),
            at: now(),
            role: 'ai',
            kind: 'question',
            field: fact.key,
            text: question.text,
            chips: question.chips,
          }
        : {
            id: nextId(),
            at: now(),
            role: 'ai',
            kind: 'text',
            text: `${FACT_LABEL[fact.key]}${particle(FACT_LABEL[fact.key], '은', '는')} 어떻게 되나요? 편하게 적어 주세요.`,
          },
    });
  }, []);

  /* 남은 게 있으면 이어서 묻고, 다 모였으면 판정을 청한다 */
  const askNextOrJudge = useCallback(async () => {
    const fresh = await api.getCase(caseId);
    const rest = fresh.facts.find((f) => f.source === 'unknown' && !f.isDisputed);
    if (rest) {
      ask(rest);
      await refresh();
      return;
    }
    const verdict = await api.judge(caseId);
    dispatch({
      type: 'append',
      message: { id: nextId(), at: now(), role: 'ai', kind: 'verdict', verdict },
    });
    await refresh();
  }, [ask, caseId, refresh]);

  const confirmFacts = useCallback(() => {
    dispatch({
      type: 'append',
      message: { id: nextId(), at: now(), role: 'user', kind: 'text', text: '네, 다 맞아요.' },
    });
    void askNextOrJudge();
  }, [askNextOrJudge]);

  const answerQuestion = useCallback(
    async (field: FactKey, chip: Chip) => {
      dispatch({
        type: 'append',
        message: { id: nextId(), at: now(), role: 'user', kind: 'choice', label: chip.label, forField: field },
      });
      await api.answerQuestion(caseId, field, chip.isUnknown ? null : chip.value);
      await askNextOrJudge();
    },
    [askNextOrJudge, caseId],
  );

  /* 사실 카드의 [고칠래요]·[알려주기] — 같은 되묻기로 이어진다 */
  const askAboutFact = useCallback(
    (key: FactKey) => {
      const fact = itemRef.current?.facts.find((f) => f.key === key);
      if (fact) ask(fact);
    },
    [ask],
  );

  const createStatement = useCallback(async () => {
    const doc = await api.createStatement(caseId);
    dispatch({
      type: 'append',
      message: { id: nextId(), at: now(), role: 'ai', kind: 'statementDraft', doc },
    });
    await refresh();
  }, [caseId, refresh]);

  const createRebuttal = useCallback(async () => {
    const doc = await api.createRebuttal(caseId);
    dispatch({
      type: 'append',
      message: { id: nextId(), at: now(), role: 'ai', kind: 'rebuttalDraft', doc },
    });
    await refresh();
    /* 만들자마자 보내기 창을 연다 — 만들기만 하고 끝내면 다음 수가 안 보인다 */
    setDrawer({ key: viewKey, which: 'rebuttal' });
  }, [caseId, refresh, viewKey]);

  const rewriteStatement = useCallback(
    async (note: string) => {
      setRewriting(true);
      try {
        const doc = await api.rewriteStatement(caseId, note);
        dispatch({
          type: 'append',
          message: { id: nextId(), at: now(), role: 'ai', kind: 'statementDraft', doc },
        });
        await refresh();
      } finally {
        setRewriting(false);
      }
    },
    [caseId, refresh],
  );

  const sendRebuttal = useCallback(
    async (draft: Rebuttal) => {
      setSending(true);
      try {
        const receipt = await api.sendRebuttal(caseId, draft);
        setDrawer(null);
        dispatch({
          type: 'append',
          message: { id: nextId(), at: receipt.at, role: 'ai', kind: 'sent', to: receipt.to },
        });
        dispatch({
          type: 'append',
          message: { id: nextId(), at: now(), role: 'ai', kind: 'nextSteps' },
        });
        await refresh();
      } finally {
        setSending(false);
      }
    },
    [caseId, refresh],
  );

  const sendText = useCallback(
    async (text: string) => {
      dispatch({
        type: 'append',
        message: { id: nextId(), at: now(), role: 'user', kind: 'text', text },
      });

      /* 되물은 항목에 대한 답이면 사실을 고치고, 판정에 쓰인 값이면 다시 판정한다 (2.7) */
      const key = pendingFact.current;
      if (key) {
        pendingFact.current = null;
        const before = itemRef.current?.verdict?.ratio ?? null;
        const rejudged = await api.patchFact(caseId, key, text);
        if (rejudged && before) {
          const cardId = nextId();
          dispatch({
            type: 'append',
            message: {
              id: cardId,
              at: now(),
              role: 'ai',
              kind: 'rejudging',
              from: before,
              reason: '판정에 쓰인 정보라서 과실비율을 다시 따지고 있어요…',
            },
          });
          await refresh();
          await new Promise((r) => setTimeout(r, 1400));
          dispatch({
            type: 'append',
            message: {
              id: nextId(),
              at: now(),
              role: 'ai',
              kind: 'verdict',
              verdict: rejudged,
              previous: before,
            },
          });
        }
        await refresh();
        if (!rejudged) await askNextOrJudge();
        return;
      }

      await api.sendMessage(caseId, text);
      await refresh();
      /* 영상이 먼저 와 있었다면 이 설명이 분석의 방아쇠가 된다 */
      if (itemRef.current?.video && itemRef.current.stages.analysis === '대기') {
        void startAnalyze();
      }
    },
    [askNextOrJudge, caseId, refresh, startAnalyze],
  );

  useEffect(() => {
    let alive = true;
    activeCase.current = caseId;
    /* 사건을 옮기면 앞 사건의 업로드·되물음은 여기서 끊는다 */
    uploadAbort.current?.abort();
    analyzeStopped.current = true;
    pendingFact.current = null;
    Promise.all([api.getCase(caseId), api.listMessages(caseId)])
      .then(([c, past]) => {
        if (!alive) return;
        setLoaded({ id: caseId, item: c });
        /* 지난 대화를 그대로 되살린다. 아직 아무 말도 오가지 않은 사건은
           접수 안내 한 장으로 시작한다 (h12) */
        dispatch({
          type: 'reset',
          messages: past.length
            ? past
            : [{ id: nextId(), at: now(), role: 'ai', kind: 'guide' }],
        });
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

  /* 서류와 판정은 사건이 아니라 대화에 실려 온다. 마지막 것이 지금 것이다 */
  const lastOf = <K extends ChatMessage['kind']>(kind: K) =>
    [...chat.messages].reverse().find((m): m is Extract<ChatMessage, { kind: K }> => m.kind === kind) ??
    null;
  const statement = lastOf('statementDraft')?.doc ?? null;
  const rebuttal = lastOf('rebuttalDraft')?.doc ?? null;
  const verdict = lastOf('verdict')?.verdict ?? null;
  /* 참고용 고지는 화면당 한 번(규칙 0.2). 판정·경위서 카드가 이미 달고 나온다 */
  const disclaimerCardId =
    [...chat.messages]
      .reverse()
      .find((m) => m.kind === 'verdict' || m.kind === 'statementDraft')?.id ?? null;
  /* 아직 확인 안 된 항목이 있으면 서류에서 단정해 쓰지 않았다고 말해 준다 (h26·h30) */
  const unknownFact = item?.facts.find((f) => f.source === 'unknown') ?? null;
  const unknownNote = unknownFact
    ? `${FACT_LABEL[unknownFact.key]}${particle(FACT_LABEL[unknownFact.key], '은', '는')} 아직 확인되지 않았어요. 이 한 가지는 본문에 단정해서 쓰지 않았어요.`
    : null;

  useEffect(() => {
    messagesRef.current = chat.messages;
  }, [chat.messages]);

  useEffect(() => {
    itemRef.current = item;
  }, [item]);

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
      {/* 1024 이상에서만 붙박이. 그 아래는 아래쪽 서랍이 같은 부품을 쓴다 */}
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
                  onCancelUpload: () => uploadAbort.current?.abort(),
                  onStopAnalyze: stopAnalyze,
                  onRetryAnalyze: () => void startAnalyze(),
                  onFixFact: askAboutFact,
                  onConfirmFacts: confirmFacts,
                  onAnswerQuestion: answerQuestion,
                  onOpenChart: () => pop('chart'),
                  onOpenPrecedent: (p) => pop('precedent', p),
                  onCreateStatement: () => void createStatement(),
                  onOpenStatement: () => show('statement'),
                  onPrintStatement: () => window.print(),
                  onCreateRebuttal: () => void createRebuttal(),
                  onOpenRebuttal: () => show('rebuttal'),
                  onOpenProcess: () => pop('process'),
                  unknownNote,
                }}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <Composer onSend={(text) => void sendText(text)} onPickVideo={pickVideo} />
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
            onOpenHistory={() => pop('history')}
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
        unknownNote={unknownNote}
        rewriting={rewriting}
        onClose={() => setDrawer(null)}
        onRewrite={(note) => void rewriteStatement(note)}
        onPrint={() => window.print()}
      />

      <RebuttalDialog
        open={openDrawer === 'rebuttal'}
        doc={rebuttal}
        claimNo={item?.claimNo ?? null}
        unknownNote={
          unknownFact ? `${unknownNote?.split('.')[0]}. 이대로 보내도 괜찮을까요?` : null
        }
        sending={sending}
        onClose={() => setDrawer(null)}
        onSend={(draft) => void sendRebuttal(draft)}
      />

      <ChartDialog open={openPopup === 'chart'} verdict={verdict} onClose={() => setPopup(null)} />
      <PrecedentDialog
        open={openPopup === 'precedent'}
        precedent={popup?.precedent ?? null}
        onClose={() => setPopup(null)}
      />
      <HistoryDialog
        open={openPopup === 'history'}
        entries={item?.history ?? []}
        onClose={() => setPopup(null)}
      />
      <ProcessDialog open={openPopup === 'process'} onClose={() => setPopup(null)} />

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
            onOpenHistory={() => pop('history')}
          />
        )}
      </Drawer>
      </div>
    </>
  );
}
