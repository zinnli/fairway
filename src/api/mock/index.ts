import type { Case } from '@/domain/case';
import { emptyStages } from '@/domain/case';
import type { ChatMessage } from '@/domain/message';
import type { Api, AnalyzeEvent } from '../types';
import { DEMO_CASES, toSummary } from './demo';
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
  logs = Object.fromEntries(Object.entries(DEMO_LOGS).map(([id, log]) => [id, [...log]]));
}
loadDemo();
/** 빈 사건 = 영상도 없고 내가 보낸 말도 하나 없는 사건.
 *  ★ sendMessage·uploadVideo를 붙일 때 logs에도 같이 쌓아야 이 판정이 계속 맞는다 */
const isBlank = (c: Case) =>
  c.video === null && !(logs[c.id] ?? []).some((m) => m.role === 'user');

const todo = (name: string) => () => Promise.reject(new Error(`mockApi.${name} 미구현`));

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
    cases = cases.filter((c) => c.id !== caseId);
    delete logs[caseId];
  },

  listMessages: async (caseId) => logs[caseId] ?? [],
  sendMessage: todo('sendMessage'),
  uploadVideo: todo('uploadVideo'),
  analyze: async function* (): AsyncGenerator<AnalyzeEvent> {
    yield { type: 'failed', hint: 'mockApi.analyze 미구현 — D2에 시연 타임라인을 채운다' };
  },
  patchFact: todo('patchFact'),
  answerQuestion: todo('answerQuestion'),
  setOpponentClaim: todo('setOpponentClaim'),
  createStatement: todo('createStatement'),
  rewriteStatement: todo('rewriteStatement'),
  renderStatementPdf: todo('renderStatementPdf'),
  createRebuttal: todo('createRebuttal'),
  updateRebuttal: todo('updateRebuttal'),
  sendRebuttal: todo('sendRebuttal'),
  listHistory: todo('listHistory'),
  resetDemo: async () => {
    loadDemo();
  },
};
