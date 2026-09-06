import type { Case, VideoRef } from '@/domain/case';
import { emptyStages } from '@/domain/case';
import type { ChatMessage, MessageBody } from '@/domain/message';
import type { Statement } from '@/domain/document';
import type { ActiveJob, CaseDetail, CaseEvents, CaseService, Session } from '../service';
import {
  ANALYSIS_SUMMARY,
  DEMO_CASES,
  DEMO_FACTS,
  DEMO_PRECEDENT_IMAGE,
  DEMO_QUESTIONS,
  DEMO_REBUTTAL,
  DEMO_STATEMENT,
  DEMO_VERDICT,
  toSummary,
} from './demo';
import { DEMO_LOGS } from './demoLog';

/**
 * 목 구현 — **서버와 같은 방식으로 움직인다.**
 * 백엔드가 흔들려도 시연이 굴러가려면 화면이 두 구현을 구분하지 못해야 한다.
 *
 * 그래서 목도 서버처럼 군다:
 * · 액션은 곧바로 돌려주고 결과 카드는 **이벤트로 밀어 준다** (분석·판정·서류 전부)
 * · 카드는 목이 만든다. 화면이 만드는 것은 업로드 중·분석 중 두 장뿐이다
 * · 지금 도는 작업은 activeJob 하나로만 알린다 — 단계는 내려보내지 않는다
 *
 * ★ 목은 올린 영상과 무관하게 같은 결과를 낸다. 실제 분석은 백엔드 몫이다.
 */

let cases: Case[] = [];
let logs: Record<string, ChatMessage[]> = {};
/** 사건마다 몇 번째 질문까지 물었는지 */
let asked: Record<string, number> = {};
/** 지금 도는 작업 — 서버의 activeJob과 같은 자리 */
let jobs: Record<string, ActiveJob | null> = {};

/* ── 이벤트 채널 (서버의 SSE 자리) ────────────────────────────────────── */

const channels = new Map<string, Set<CaseEvents>>();

function emit(caseId: string, fn: (on: CaseEvents) => void) {
  for (const on of channels.get(caseId) ?? []) fn(on);
}

const newCaseId = () =>
  `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 4)}`;
const newMessageId = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function loadDemo() {
  cases = DEMO_CASES.map((c) => ({ ...c }));
  logs = Object.fromEntries(
    Object.entries(DEMO_LOGS)
      .filter(([id]) => cases.some((c) => c.id === id))
      .map(([id, log]) => [id, [...log]]),
  );
  asked = {};
  jobs = {};
}
loadDemo();

const find = (caseId: string) => cases.find((c) => c.id === caseId) ?? null;

/** 빈 사건 = 영상도 없고 내가 보낸 말도 하나 없는 사건 */
const isBlank = (c: Case) =>
  c.video === null && !(logs[c.id] ?? []).some((m) => m.role === 'user');

/** 카드 한 장을 로그에 쌓고 채널로 흘린다 — 서버가 하는 일과 같다 */
function push(caseId: string, body: MessageBody): ChatMessage {
  const message = { ...body, id: newMessageId(), at: now() } as ChatMessage;
  (logs[caseId] ??= []).push(message);
  const c = find(caseId);
  if (c) c.updatedAt = message.at;
  emit(caseId, (on) => on.message?.(message));
  return message;
}

/** 사건이 바뀌었다고 알린다 */
function touch(caseId: string) {
  const c = find(caseId);
  if (!c) return;
  c.updatedAt = now();
  emit(caseId, (on) => on.caseUpdated?.({ ...c }, jobs[caseId] ?? null));
}

function setJob(caseId: string, job: ActiveJob | null) {
  jobs[caseId] = job;
  touch(caseId);
}

const detail = (c: Case): CaseDetail => ({ item: { ...c }, activeJob: jobs[c.id] ?? null });

/* ── 흐름 ─────────────────────────────────────────────────────────────── */

/** 영상과 설명이 모이면 버튼 없이 시작된다 (기능명세 1.4 · 유저플로우 F1) */
async function runAnalysis(caseId: string) {
  const c = find(caseId);
  if (!c) return;
  c.status = '분석중';
  c.stages = { ...c.stages, analysis: '진행중' };
  setJob(caseId, { kind: 'analysis' });

  await wait(4200);
  if (!find(caseId)) return;

  c.title ??= '교차로 직진 충돌 · 08-22';
  /* 확인된 사실은 영상 분석이 끝나야 생긴다 — 그 전에는 null이라 현황판에 안 뜬다 */
  c.facts = DEMO_FACTS;
  push(caseId, { role: 'ai', kind: 'text', text: ANALYSIS_SUMMARY });
  push(caseId, { role: 'ai', kind: 'text', text: DEMO_QUESTIONS[0] });
  asked[caseId] = 1;
  c.status = '확인 필요';
  setJob(caseId, null);
}

async function runJudge(caseId: string) {
  const c = find(caseId);
  if (!c) return;
  c.stages = { ...c.stages, analysis: '완료', verdict: '진행중' };
  setJob(caseId, { kind: 'verdict' });

  await wait(2400);
  if (!find(caseId)) return;

  c.verdict = DEMO_VERDICT;
  c.stages = { ...c.stages, verdict: '완료' };
  c.status = '판정 완료';
  push(caseId, { role: 'ai', kind: 'verdict', verdict: DEMO_VERDICT });
  setJob(caseId, null);
}

const latestStatement = (caseId: string): Statement | null => {
  const found = [...(logs[caseId] ?? [])]
    .reverse()
    .find((m) => m.kind === 'statementDraft');
  return found && found.kind === 'statementDraft' ? found.doc : null;
};

/* ── 구현 ─────────────────────────────────────────────────────────────── */

/**
 * 목의 세션 — 자격은 보지 않지만 **로그인은 실제로 거쳐야 한다** (9/5 결정).
 * 그러지 않으면 목으로 도는 동안에는 가드가 아무것도 막지 못한다.
 *
 * 새로고침해도 남아야 해서 브라우저에 적어 둔다. 목에는 토큰이 없고 누구인지만 적으므로
 * "액세스 토큰은 메모리에만" 규칙과 부딪히지 않는다 — http 구현은 지금도 메모리다.
 */
const SESSION_KEY = 'cardefender.mock.session';

const readSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

const writeSession = (user: Session | null) => {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* 시크릿 창처럼 못 쓰는 경우 — 그 창에서는 새로고침하면 다시 로그인한다 */
  }
};

const asUser = (email: string): Session => ({
  id: 'demo-user',
  email,
  onboardedAt: null,
  isDemo: true,
});

export const mockService: CaseService = {
  /* 목에는 가입자 명부가 없다. 형식만 맞으면 들여보내되, 거치기는 거쳐야 한다 */
  login: async (email) => {
    const user = asUser(email);
    writeSession(user);
    return user;
  },
  signup: async (input) => {
    const user = asUser(input.email);
    writeSession(user);
    return user;
  },
  logout: async () => writeSession(null),
  restoreSession: async () => readSession(),
  /* 목에는 법무 문구가 없다. 화면이 아는 것을 쓰게 null을 준다 */
  getLegalDoc: async () => null,

  /* 목에는 메일이 없다. 문구만 서버와 같게 돌려준다 */
  requestPasswordReset: async () => '비밀번호 재설정 링크를 보냈어요. 메일함을 확인해 주세요.',
  resetPassword: async () => '비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.',

  /* 목에는 가입자 명부가 없다. 시연에 걸리지 않게 늘 쓸 수 있다고 한다 */
  isEmailAvailable: async () => ({ available: true, reason: null }),

  completeOnboarding: async () => {},

  listCases: async () =>
    [...cases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toSummary),

  getCase: async (caseId) => {
    const c = find(caseId);
    if (!c) throw new Error(`사건을 찾을 수 없어요: ${caseId}`);
    return detail(c);
  },

  /** 빈 사건이 이미 있으면 새로 만들지 않고 그걸 다시 쓴다 — 빈 사건이 쌓이지 않게 */
  createCase: async () => {
    const blank = cases.find(isBlank);
    if (blank) return { ...blank };

    const created: Case = {
      id: newCaseId(),
      title: null,
      status: '접수중',
      stages: emptyStages(),
      video: null,
      verdict: null,
      facts: null,
      accidentAt: null,
      accidentPlace: null,
      claimNo: null,
      createdAt: now(),
      updatedAt: now(),
    };
    cases = [created, ...cases];
    /* 사건을 만들면 접수 안내가 먼저 붙는다 (h12) */
    logs[created.id] = [
      { id: newMessageId(), at: created.createdAt, role: 'ai', kind: 'guide' },
    ];
    return { ...created };
  },

  renameCase: async (caseId, title) => {
    const c = find(caseId);
    if (c) {
      c.title = title;
      c.updatedAt = now();
    }
  },

  deleteCase: async (caseId) => {
    cases = cases.filter((c) => c.id !== caseId);
    delete logs[caseId];
    delete asked[caseId];
    delete jobs[caseId];
  },

  listMessages: async (caseId) => [...(logs[caseId] ?? [])],

  sendMessage: async (caseId, text) => {
    const c = find(caseId);
    if (!c) throw new Error(`사건을 찾을 수 없어요: ${caseId}`);

    const mine: ChatMessage = {
      id: newMessageId(),
      at: now(),
      role: 'user',
      kind: 'text',
      text,
    };
    (logs[caseId] ??= []).push(mine);
    c.updatedAt = mine.at;

    /* 답이 어디로 가는지는 사건이 어디까지 왔는지가 정한다 (서버 §1.1과 같은 갈래) */
    void (async () => {
      await wait(700);
      const asking = asked[caseId] ?? 0;

      if (asking > 0 && asking < DEMO_QUESTIONS.length) {
        push(caseId, { role: 'ai', kind: 'text', text: DEMO_QUESTIONS[asking] });
        asked[caseId] = asking + 1;
        return;
      }
      if (asking >= DEMO_QUESTIONS.length && c.verdict === null) {
        asked[caseId] = 0;
        push(caseId, { role: 'ai', kind: 'text', text: '알겠어요. 과실비율을 계산할게요.' });
        await runJudge(caseId);
        return;
      }
      /* 영상이 먼저 와 있었다면 이 설명이 분석의 방아쇠가 된다 */
      if (c.video && c.stages.analysis === '대기') {
        await runAnalysis(caseId);
        return;
      }
      /* **어느 갈래에도 걸리지 않으면 반드시 한 마디는 한다.**
         판정이 끝난 뒤에 아무 말이나 치면 위 셋이 전부 거짓이라 답이 없었고,
         화면의 답 대기 표시가 영영 돌았다. 서버는 언제나 reply를 준다(§1.1 ④) */
      push(caseId, {
        role: 'ai',
        kind: 'text',
        text: c.verdict
          ? '말씀 잘 들었어요. 판정은 그대로예요 — 서류를 만들거나 보내는 것을 도와드릴게요.'
          : '알겠어요. 영상을 올려 주시면 분석을 시작할게요.',
      });
    })();

    return mine;
  },

  uploadVideo: async (caseId, file, onProgress) => {
    const c = find(caseId);
    if (!c) throw new Error(`사건을 찾을 수 없어요: ${caseId}`);

    const objectUrl = URL.createObjectURL(file);
    const durationSec = await readDuration(objectUrl);

    for (let percent = 8; percent <= 100; percent += 8) {
      await wait(120);
      onProgress(Math.min(100, percent));
    }

    const video: VideoRef = {
      id: `video-${file.name}-${file.size}`,
      name: file.name,
      sizeBytes: file.size,
      durationSec,
      objectUrl,
    };
    c.video = video;
    c.updatedAt = now();
    /* 첨부 카드는 서버가 만든다 — 목도 같게 군다 */
    push(caseId, { role: 'user', kind: 'video', video });

    const described = (logs[caseId] ?? []).some((m) => m.role === 'user' && m.kind === 'text');
    if (described) {
      void runAnalysis(caseId);
    } else {
      /* 설명이 없으면 청한다. 이 문구는 Agent가 아니라 고정 문구다 (명세 D-1 ⑤) */
      void wait(400).then(() =>
        push(caseId, {
          role: 'ai',
          kind: 'text',
          text: '영상 잘 받았어요. 사고 상황을 한두 문장으로 알려 주시면 바로 분석을 시작할게요.',
        }),
      );
    }

    return { video, needsDescription: !described, analysisStarted: described };
  },

  getVideo: async (videoId) => {
    const found = cases.find((c) => c.video?.id === videoId)?.video;
    if (!found) throw new Error(`영상을 찾을 수 없어요: ${videoId}`);
    return found;
  },

  getVerdict: async (caseId) => find(caseId)?.verdict ?? null,

  /* 서버와 같은 소제목 구조로 준다 — 목과 서버가 같은 화면으로 그려진다.
     목에는 그림 파일이 없으므로 imageUrl은 null이다 (화면은 figure 자체를 안 그린다) */
  getPrecedent: async (_caseId, precedent) => ({
    bodyText: [
      '사고 유형',
      `차대이륜차 직진 대 직진 사고 · 신호기 있는 사거리 교차로 (${precedent.summary})`,
      '사고 내용',
      '청구차량이 녹색신호에 교차로를 직진 통과하던 중, 좌측 도로에서 적색신호에 진입한 ' +
        '피청구 이륜차와 충돌한 사고임.',
      '쟁점',
      '피청구차량이 적색신호에 교차로에 진입하였는지 여부',
      '청구차량에게 전방주시의무 위반이 있었는지 여부',
      '과실비율',
      '기본 30:70 → 결정 0:100 (A 청구차량 : B 피청구차량)',
      '심의 이유',
      '블랙박스 영상에 의하여 피청구차량의 신호위반이 명백히 확인되는 점, 청구차량이 이를 ' +
        '미리 알아차리거나 피할 수 없었던 점을 고려하여 결정함.',
      '참고 인정기준',
      '도표 213(나)',
      '내 사건과 비슷한 점',
      '사고 장소 유형: 신호기 있는 사거리 교차로',
      '신호 조건: 상대 차량 적색신호 진입',
      '충돌 형태: 직진 중 측면 충돌',
      '내 사건과 다른 점',
      '상대 차량 종류: 사례는 이륜차, 본 사건은 확인 필요',
      '판정에서의 역할',
      '가장 비슷한 사례예요. 이 사례의 결정비율 0:100을 기준값으로 삼아 내 사건의 예상 ' +
        '과실비율을 계산했어요.',
    ].join('\n\n'),
    /* 목에는 진짜 그림이 없다. 배치를 볼 수 있게 같은 비율의 자리표시자를 준다 —
       서버에 붙으면 서버가 준 서명 주소가 대신 들어온다 */
    imageUrl: DEMO_PRECEDENT_IMAGE,
    imageCaption: '출처: 손해보험협회 자동차사고 과실비율 인정기준 · 과실비율 심의사례',
  }),

  createStatement: async (caseId) => {
    const c = find(caseId);
    if (!c) return;
    setJob(caseId, { kind: 'report' });
    void (async () => {
      await wait(900);
      if (!find(caseId)) return;
      const doc = { ...DEMO_STATEMENT, updatedAt: now() };
      c.stages = { ...c.stages, statement: '완료' };
      push(caseId, { role: 'ai', kind: 'statementDraft', doc });
      setJob(caseId, null);
    })();
  },

  /** UPDATE가 아니라 새 버전이다. 카드가 한 장 더 붙는다 */
  reviseStatement: async (caseId) => {
    const before = latestStatement(caseId) ?? DEMO_STATEMENT;
    setJob(caseId, { kind: 'report' });
    void (async () => {
      await wait(1200);
      if (!find(caseId)) return;
      push(caseId, {
        role: 'ai',
        kind: 'statementDraft',
        doc: { ...before, version: before.version + 1, updatedAt: now() },
      });
      setJob(caseId, null);
    })();
  },

  getStatement: async (caseId) => latestStatement(caseId) ?? DEMO_STATEMENT,

  /* 서버가 PDF를 만들어 주기 전까지는 인쇄 CSS로 대신한다 (html2canvas는 쓰지 않는다) */
  downloadStatementPdf: async () => {
    window.print();
  },

  createRebuttal: async (caseId) => {
    const c = find(caseId);
    if (!c) return;
    setJob(caseId, { kind: 'rebuttal' });
    void (async () => {
      await wait(900);
      if (!find(caseId)) return;
      c.stages = { ...c.stages, rebuttal: '진행중' };
      /* 갓 만든 초안은 아직 보내지 않았다 — DEMO_REBUTTAL은 발송 뒤 모습이라 sentAt이 차 있다 */
      push(caseId, { role: 'ai', kind: 'rebuttalDraft', doc: { ...DEMO_REBUTTAL, sentAt: null } });
      setJob(caseId, null);
    })();
  },

  getRebuttal: async (caseId) => {
    const found = [...(logs[caseId] ?? [])].reverse().find((m) => m.kind === 'rebuttalDraft');
    return found && found.kind === 'rebuttalDraft' ? found.doc : { ...DEMO_REBUTTAL, sentAt: null };
  },

  updateRebuttal: async (caseId, patch) => {
    const found = [...(logs[caseId] ?? [])].reverse().find((m) => m.kind === 'rebuttalDraft');
    const before =
      found && found.kind === 'rebuttalDraft' ? found.doc : { ...DEMO_REBUTTAL, sentAt: null };
    const next = { ...before, ...patch };
    if (found && found.kind === 'rebuttalDraft') found.doc = next;
    return next;
  },

  sendRebuttal: async (caseId) => {
    const c = find(caseId);
    if (!c) return;
    await wait(1200);
    const draft = [...(logs[caseId] ?? [])].reverse().find((m) => m.kind === 'rebuttalDraft');
    const doc = draft && draft.kind === 'rebuttalDraft' ? draft.doc : DEMO_REBUTTAL;
    const to = doc.to;
    /* 서버는 실제로 붙인 파일을 센다 — 목도 [보내기]에서 켜 둔 것만 센다 (명세 §4.10) */
    const attachmentCount = doc.attachments.filter((a) => a.included).length;
    const at = now();
    if (draft && draft.kind === 'rebuttalDraft') draft.doc = { ...draft.doc, sentAt: at };
    c.stages = { ...c.stages, rebuttal: '완료' };
    c.status = '발송 완료';
    push(caseId, { role: 'ai', kind: 'sent', to, attachmentCount });
    push(caseId, { role: 'ai', kind: 'nextSteps' });
    emit(caseId, (on) => on.rebuttalSent?.(at, to));
    touch(caseId);
  },

  subscribe: (caseId, on) => {
    const set = channels.get(caseId) ?? new Set<CaseEvents>();
    set.add(on);
    channels.set(caseId, set);
    return () => {
      set.delete(on);
      if (set.size === 0) channels.delete(caseId);
    };
  },
};

/** 시연·리허설용. 목에만 있다 */
export const resetDemo = () => loadDemo();

/**
 * 영상 길이는 브라우저에게 물어본다. 못 읽으면 0을 준다 —
 * 코덱을 지원하지 않는 파일(mp4v·HEVC)이면 여기서 걸린다.
 */
function readDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => resolve(Number.isFinite(el.duration) ? el.duration : 0);
    el.onerror = () => resolve(0);
    el.src = url;
  });
}
