import type { Case, VideoRef } from '@/domain/case';
import { emptyStages } from '@/domain/case';
import { ANALYZE_STEPS, FACTS_TITLE } from '@/domain/analysis';
import type { ChatMessage, MessageBody } from '@/domain/message';
import { VIDEO_LIMITS } from '@/config';
import { mb } from '@/lib/format';
import { ApiError } from '../error';
import type { Api, AnalyzeEvent } from '../types';
import {
  DEMO_CASES,
  DEMO_REBUTTAL,
  DEMO_STATEMENT,
  FACTS_ANALYZING,
  FACTS_PENDING,
  VERDICT_AMBER,
  VERDICT_RED,
  toSummary,
} from './demo';
import { DEMO_LOGS } from './demoLog';

/**
 * 목 구현 자리.
 * 사건 목록(S3)에 필요한 만큼만 메모리로 채웠다.
 * Dexie 영속화 + MSW 핸들러 + 분석 타임라인은 작업 화면(S4)을 만들 때 이어 붙인다.
 */

/** 메모리 저장소. 새로고침하면 시연 데이터로 돌아간다 */
let cases: Case[] = [];
let logs: Record<string, ChatMessage[]> = {};

/**
 * 목 전용 id — 서버가 붙는 날 이 함수만 지운다.
 * UTC 밀리초를 36진수로 눕히고 난수 두 자를 붙인다.
 * · 사전순 = 만든 순서 (목록을 id로도 줄 세울 수 있다)
 * · 같은 밀리초에 두 번 눌러도 갈린다 ([새 사건] 연타)
 * · 시차·서머타임과 무관하다
 * 화면은 이 규칙을 몰라야 한다. 날짜가 필요하면 createdAt을 읽는다.
 */
const newCaseId = () =>
  `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 4)}`;

function loadDemo() {
  cases = DEMO_CASES.map((c) => ({ ...c }));
  logs = Object.fromEntries(
    Object.entries(DEMO_LOGS)
      .filter(([id]) => cases.some((c) => c.id === id))
      .map(([id, log]) => [id, [...log]]),
  );
}
loadDemo();
/** 빈 사건 = 영상도 없고 내가 보낸 말도 하나 없는 사건.
 *  ★ sendMessage·uploadVideo를 붙일 때 logs에도 같이 쌓아야 이 판정이 계속 맞는다 */
const isBlank = (c: Case) =>
  c.video === null && !(logs[c.id] ?? []).some((m) => m.role === 'user');


const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 로그에도 같이 쌓아야 새로고침 뒤에 대화가 남고, isBlank 판정도 계속 맞는다 */
function push(caseId: string, body: MessageBody) {
  const log = (logs[caseId] ??= []);
  log.push({ ...body, id: `${caseId}-log-${log.length + 1}`, at: new Date().toISOString() } as ChatMessage);
}

/** 확장자까지 봐 준다 — 브라우저가 avi·mov의 MIME을 비워 두는 일이 있다 */
function acceptable(file: File): boolean {
  if ((VIDEO_LIMITS.accept as readonly string[]).includes(file.type)) return true;
  return /\.(mp4|mov|avi)$/i.test(file.name);
}

/** 길이는 브라우저에게 물어본다. 못 읽으면 0으로 두고 길이 검사를 건너뛴다 */
function readDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.onloadedmetadata = () => resolve(Number.isFinite(el.duration) ? el.duration : 0);
    el.onerror = () => resolve(0);
    el.src = url;
  });
}

export const mockApi: Api = {
  listCases: async () =>
    [...cases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toSummary),

  getCase: async (caseId) => {
    const found = cases.find((c) => c.id === caseId);
    if (!found) throw new Error(`사건을 찾을 수 없어요: ${caseId}`);
    return found;
  },

  createCase: async () => {
    /* [새 사건]을 연달아 눌러도 빈 사건이 쌓이지 않게, 이미 있으면 그것을 다시 쓴다.
       기능명세 1.1은 "누르면 3초 안에 채팅이 열린다"고만 하지 매번 새로 만들라고 하지 않는다.
       버튼을 잠그지 않는 이유도 같다 — 잠그면 그 확인 문장이 깨진다 */
    const blank = cases.find(isBlank);
    if (blank) return blank;

    const now = new Date().toISOString();
    const created: Case = {
      id: newCaseId(),
      title: null, // 분석 뒤 AI가 붙인다
      status: '접수중',
      stages: emptyStages(),
      facts: [],
      video: null,
      verdict: null,
      previousRatio: null,
      accidentAt: null,
      accidentPlace: null,
      claimNo: null,
      history: [],
      createdAt: now,
      updatedAt: now,
    };
    cases = [created, ...cases];
    return created;
  },

  renameCase: async (caseId, title) => {
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      found.title = title;
      found.updatedAt = new Date().toISOString();
    }
  },

  deleteCase: async (caseId) => {
    /* 영상은 사건 안에서만 산다 (규칙 0.4). 사건을 지우면 브라우저가 물고 있던
       objectUrl도 같이 놓아 준다 */
    const gone = cases.find((c) => c.id === caseId);
    if (gone?.video?.objectUrl) URL.revokeObjectURL(gone.video.objectUrl);
    cases = cases.filter((c) => c.id !== caseId);
    delete logs[caseId];
  },

  listMessages: async (caseId) => logs[caseId] ?? [],

  appendMessage: async (caseId, body) => {
    push(caseId, body);
  },

  sendMessage: async (caseId, text) => {
    push(caseId, { role: 'user', kind: 'text', text });
    const found = cases.find((c) => c.id === caseId);
    if (found) found.updatedAt = new Date().toISOString();
  },

  uploadVideo: async (caseId, file, onProgress, signal) => {
    const found = cases.find((c) => c.id === caseId);
    if (!found) {
      throw new ApiError('upload/network', '사건을 찾지 못했어요. 새로고침한 뒤 다시 올려 주세요.');
    }
    if (!acceptable(file)) {
      throw new ApiError(
        'upload/format',
        'mp4·mov·avi만 올릴 수 있어요. mp4로 바꿔 다시 올려 주세요.',
      );
    }
    if (file.size > VIDEO_LIMITS.maxBytes) {
      throw new ApiError(
        'upload/size',
        `파일이 ${mb(VIDEO_LIMITS.maxBytes)}를 넘어 올릴 수 없었어요. ` +
          '사고 앞뒤 1~2분만 잘라서 다시 올려 주세요. mp4 형식을 권장해요.',
      );
    }

    const objectUrl = URL.createObjectURL(file);
    const durationSec = await readDuration(objectUrl);
    if (durationSec > VIDEO_LIMITS.maxSeconds) {
      URL.revokeObjectURL(objectUrl);
      throw new ApiError(
        'upload/size',
        `영상이 ${Math.round(VIDEO_LIMITS.maxSeconds / 60)}분을 넘어요. ` +
          '사고 앞뒤 1~2분만 잘라서 다시 올려 주세요.',
      );
    }

    /* 실제로 보낼 데가 없으니 진행률만 흉내낸다. 취소는 진짜로 듣는다 */
    for (let percent = 8; percent <= 100; percent += 8) {
      await wait(120);
      if (signal?.aborted) {
        URL.revokeObjectURL(objectUrl);
        throw new ApiError(
          'upload/canceled',
          '업로드를 취소했어요. 영상이 있어야 분석을 시작할 수 있어요. 준비되면 다시 올려 주세요.',
        );
      }
      onProgress(Math.min(100, percent));
    }

    const video: VideoRef = {
      id: `video-${file.name}-${file.size}`,
      name: file.name,
      sizeBytes: file.size,
      durationSec,
      objectUrl,
    };
    found.video = video;
    found.updatedAt = new Date().toISOString();
    push(caseId, { role: 'user', kind: 'video', video });
    return video;
  },

  analyze: async function* (caseId): AsyncGenerator<AnalyzeEvent> {
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      found.status = '분석중';
      found.stages = { ...found.stages, analysis: '진행중' };
    }

    for (const [i, step] of ANALYZE_STEPS.entries()) {
      await wait(1200);
      yield { type: 'step', label: step.doing };
      /* 시안 h16처럼 단계가 지날수록 현황판에 사실이 쌓인다 */
      if (found && i >= 1) found.facts = FACTS_ANALYZING.slice(0, Math.min(i, FACTS_ANALYZING.length));
    }

    await wait(800);
    if (found) {
      found.facts = FACTS_PENDING;
      found.stages = { ...found.stages, analysis: '완료' };
      found.status = '확인 필요';
      /* 제목은 분석이 끝나면 AI가 붙인다 (기능명세 1.1).
         목이라 사고 유형은 하나만 안다 — 날짜는 접수일에서 가져와 어긋나지 않게 한다.
         서버가 붙으면 진짜 이름이 온다 */
      const at = new Date(found.createdAt);
      const mmdd = `${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
      found.title ??= `교차로 직진 충돌 · ${mmdd}`;
      found.updatedAt = new Date().toISOString();
      push(caseId, { role: 'ai', kind: 'facts', facts: FACTS_PENDING });
    }
    yield { type: 'facts', facts: FACTS_PENDING, title: FACTS_TITLE };
  },
  answerQuestion: async (caseId, key, value) => {
    const found = cases.find((c) => c.id === caseId);
    if (!found) return;
    found.facts = found.facts.map((f) =>
      f.key === key
        ? value === null
          ? { ...f, source: 'unknown' as const, isDisputed: true }
          : { key, value, source: 'statement' as const }
        : f,
    );
    found.updatedAt = new Date().toISOString();
  },

  patchFact: async (caseId, key, value) => {
    const found = cases.find((c) => c.id === caseId);
    if (!found) return null;
    found.facts = found.facts.map((f) =>
      f.key === key ? { key, value, source: 'statement' as const } : f,
    );
    found.history = [
      ...found.history,
      {
        id: `h-${found.history.length + 1}`,
        at: new Date().toISOString(),
        kind: 'fact',
        text: `${key}: ${value} (내가 말한 것)`,
      },
    ];
    found.updatedAt = new Date().toISOString();
    /* 판정에 쓰인 항목이면 다시 따진다 (2.7). 목은 상대 신호 하나만 안다 */
    if (key === 'opponentSignal' && found.verdict) {
      found.previousRatio = found.verdict.ratio;
      found.verdict = VERDICT_AMBER;
      return VERDICT_AMBER;
    }
    return null;
  },

  judge: async (caseId) => {
    await wait(600);
    const found = cases.find((c) => c.id === caseId);
    const amber = found?.facts.some((f) => f.key === 'opponentSignal' && f.value?.includes('황색'));
    const verdict = amber ? VERDICT_AMBER : VERDICT_RED;
    if (found) {
      found.verdict = verdict;
      found.stages = { ...found.stages, verdict: '완료' };
      found.status = '판정 완료';
      found.history = [
        ...found.history,
        {
          id: `h-${found.history.length + 1}`,
          at: new Date().toISOString(),
          kind: 'verdict',
          text: `판정 — 나 ${verdict.ratio.mine} : 상대 ${verdict.ratio.opponent}`,
        },
      ];
      found.updatedAt = new Date().toISOString();
      push(caseId, { role: 'ai', kind: 'verdict', verdict });
    }
    return verdict;
  },

  setOpponentClaim: async (caseId, ratio) => {
    const found = cases.find((c) => c.id === caseId);
    if (!found?.verdict) return;
    found.verdict = { ...found.verdict, opponentClaim: ratio };
    found.updatedAt = new Date().toISOString();
  },

  createStatement: async (caseId) => {
    await wait(700);
    const found = cases.find((c) => c.id === caseId);
    const doc = { ...DEMO_STATEMENT, updatedAt: new Date().toISOString() };
    if (found) {
      found.stages = { ...found.stages, statement: '완료' };
      found.updatedAt = doc.updatedAt;
      push(caseId, { role: 'ai', kind: 'statementDraft', doc });
    }
    return doc;
  },

  rewriteStatement: async (caseId) => {
    await wait(700);
    const doc = {
      ...DEMO_STATEMENT,
      version: DEMO_STATEMENT.version + 1,
      updatedAt: new Date().toISOString(),
    };
    push(caseId, { role: 'ai', kind: 'statementDraft', doc });
    return doc;
  },

  renderStatementPdf: async () => {
    /* 한글이 이미지로 뭉개지지 않게 브라우저 인쇄를 쓴다. 인쇄 본문은 화면이 들고 있다 */
    window.print();
  },

  createRebuttal: async (caseId) => {
    await wait(700);
    const doc = { ...DEMO_REBUTTAL, sentAt: null };
    push(caseId, { role: 'ai', kind: 'rebuttalDraft', doc });
    const found = cases.find((c) => c.id === caseId);
    if (found) found.updatedAt = new Date().toISOString();
    return doc;
  },

  updateRebuttal: async (_caseId, draft) => draft,

  sendRebuttal: async (caseId, draft) => {
    await wait(900);
    const at = new Date().toISOString();
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      found.stages = { ...found.stages, rebuttal: '완료' };
      found.status = '발송 완료';
      found.updatedAt = at;
      push(caseId, { role: 'ai', kind: 'sent', to: draft.to });
      push(caseId, { role: 'ai', kind: 'nextSteps' });
    }
    return { at, to: draft.to };
  },

  listHistory: async (caseId) => cases.find((c) => c.id === caseId)?.history ?? [],
  resetDemo: async () => {
    loadDemo();
  },
};
