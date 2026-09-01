import type { Case } from '@/domain/case';
import { emptyStages } from '@/domain/case';
import type { Api, AnalyzeEvent } from '../types';
import { DEMO_CASES, toSummary } from './demo';

/**
 * 목 구현 자리.
 * 사건 목록(S3)에 필요한 만큼만 메모리로 채웠다.
 * Dexie 영속화 + MSW 핸들러 + 분석 타임라인은 작업 화면(S4)을 만들 때 이어 붙인다.
 */

/** 메모리 저장소. 새로고침하면 시연 데이터로 돌아간다 */
let cases: Case[] = DEMO_CASES.map((c) => ({ ...c }));
let nextId = 1;
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
    const now = new Date().toISOString();
    const created: Case = {
      id: `case-new-${nextId++}`,
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
  },
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
  resetDemo: todo('resetDemo'),
};
