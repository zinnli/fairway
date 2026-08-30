import type { Api, AnalyzeEvent } from '../types';

/**
 * 목 구현 자리.
 * D2에 Dexie 스키마 + MSW 핸들러 + 시연 타임라인을 여기에 채운다.
 * 지금은 계약이 컴파일되는지 확인하는 골격이다.
 */
const todo = (name: string) => () => Promise.reject(new Error(`mockApi.${name} 미구현`));

export const mockApi: Api = {
  listCases: todo('listCases'),
  getCase: todo('getCase'),
  createCase: todo('createCase'),
  renameCase: todo('renameCase'),
  deleteCase: todo('deleteCase'),
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
