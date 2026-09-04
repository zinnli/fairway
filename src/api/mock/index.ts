import type { Case, VideoRef } from '@/domain/case';
import { emptyStages } from '@/domain/case';
import type { ChatMessage, MessageBody } from '@/domain/message';
import type { Api } from '../types';
import {
  ANALYSIS_SUMMARY,
  DEMO_CASES,
  DEMO_QUESTIONS,
  DEMO_REBUTTAL,
  DEMO_STATEMENT,
  DEMO_VERDICT,
  toSummary,
} from './demo';
import { DEMO_LOGS } from './demoLog';

/**
 * 목 구현. 지금은 메모리에만 산다 — 새로고침하면 시연 데이터로 돌아간다.
 *
 * 9/3 축소 뒤 흐름은 한 줄기다:
 *   영상 → 분석(로딩) → 요약 글 → 글로 되묻기 → 판정 → 서류 → 발송.
 * 되돌아가는 길(사실 고치기·재판정·이력)은 없다.
 *
 * ★ 목은 올린 영상과 무관하게 같은 결과를 낸다. 실제 분석은 다음 이슈다.
 */

let cases: Case[] = [];
let logs: Record<string, ChatMessage[]> = {};
/** 사건마다 몇 번째 질문까지 물었는지. 사실을 항목으로 들고 있지 않으니 이걸로 센다 */
let asked: Record<string, number> = {};

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
  asked = {};
}
loadDemo();

/** 빈 사건 = 영상도 없고 내가 보낸 말도 하나 없는 사건 */
const isBlank = (c: Case) =>
  c.video === null && !(logs[c.id] ?? []).some((m) => m.role === 'user');

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** 로그에도 같이 쌓아야 새로고침 뒤에 대화가 남고, isBlank 판정도 계속 맞는다 */
function push(caseId: string, body: MessageBody) {
  const log = (logs[caseId] ??= []);
  log.push({ ...body, id: `${caseId}-log-${log.length + 1}`, at: new Date().toISOString() } as ChatMessage);
}

/** 길이는 브라우저에게 물어본다. 못 읽으면 0으로 둔다 */
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
      video: null,
      verdict: null,
      accidentAt: null,
      accidentPlace: null,
      claimNo: null,
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
    delete asked[caseId];
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

  /* 검사·취소·실패는 범위 밖이다 (04 문서 C4). 진행률만 흉내내고 끝난다 */
  uploadVideo: async (caseId, file, onProgress) => {
    const found = cases.find((c) => c.id === caseId);
    if (!found) throw new Error(`사건을 찾을 수 없어요: ${caseId}`);

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
    found.video = video;
    found.updatedAt = new Date().toISOString();
    push(caseId, { role: 'user', kind: 'video', video });
    return video;
  },

  /* 단계 시각화 없이 한 번 기다렸다가 요약 글을 준다 (04 문서 C6·C7) */
  analyze: async (caseId) => {
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      found.status = '분석중';
      found.stages = { ...found.stages, analysis: '진행중' };
    }

    await wait(4200);

    if (found) {
      found.stages = { ...found.stages, analysis: '완료' };
      found.status = '확인 필요';
      /* 제목은 분석이 끝나면 AI가 붙인다 (기능명세 1.1).
         목이라 사고 유형은 하나만 안다 — 날짜는 접수일에서 가져와 어긋나지 않게 한다 */
      const at = new Date(found.createdAt);
      const mmdd = `${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
      found.title ??= `교차로 직진 충돌 · ${mmdd}`;
      found.updatedAt = new Date().toISOString();
      push(caseId, { role: 'ai', kind: 'text', text: ANALYSIS_SUMMARY });
    }

    asked[caseId] = 1;
    push(caseId, { role: 'ai', kind: 'text', text: DEMO_QUESTIONS[0] });
    return { summary: ANALYSIS_SUMMARY, question: DEMO_QUESTIONS[0] };
  },

  /* 답은 글로 받는다. 아직 물을 게 남았으면 다음 질문을, 없으면 null을 준다 */
  answerQuestion: async (caseId, text) => {
    push(caseId, { role: 'user', kind: 'text', text });
    const done = asked[caseId] ?? 0;
    const found = cases.find((c) => c.id === caseId);
    if (found) found.updatedAt = new Date().toISOString();

    const next = DEMO_QUESTIONS[done] ?? null;
    if (next) {
      asked[caseId] = done + 1;
      push(caseId, { role: 'ai', kind: 'text', text: next });
    }
    return { question: next };
  },

  judge: async (caseId) => {
    await wait(600);
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      found.verdict = DEMO_VERDICT;
      found.stages = { ...found.stages, verdict: '완료' };
      found.status = '판정 완료';
      found.updatedAt = new Date().toISOString();
      push(caseId, { role: 'ai', kind: 'verdict', verdict: DEMO_VERDICT });
    }
    return DEMO_VERDICT;
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

  /* 다시 쓰기 — 목은 글을 실제로 고치지 않고 버전만 올린다.
     진짜 문장 수정은 백엔드 몫이다 (h31 진행 화면은 9/3에 빠져 로딩 표시가 없다) */
  rewriteStatement: async (caseId) => {
    await wait(1200);
    const found = cases.find((c) => c.id === caseId);
    const last = [...(logs[caseId] ?? [])].reverse().find((m) => m.kind === 'statementDraft');
    const before = last && last.kind === 'statementDraft' ? last.doc : DEMO_STATEMENT;
    const doc = { ...before, version: before.version + 1, updatedAt: new Date().toISOString() };
    if (found) {
      found.updatedAt = doc.updatedAt;
      push(caseId, { role: 'ai', kind: 'statementDraft', doc });
    }
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

  resetDemo: async () => {
    loadDemo();
  },
};
