import type { Case, CaseSummary, HistoryEntry, VideoRef } from '@/domain/case';
import type { Fact, FactKey } from '@/domain/fact';
import type { Ratio, Verdict } from '@/domain/verdict';
import type { Rebuttal, SentReceipt, Statement } from '@/domain/document';

/** 분석 진행 이벤트 — 실서버에서는 SSE, 목에서는 타이머 */
export type AnalyzeEvent =
  | { type: 'step'; label: string }
  | { type: 'facts'; facts: Fact[]; title: string }
  | { type: 'failed'; hint: string };

/**
 * 화면은 이 인터페이스만 안다.
 * 02_기능명세서.md 맨 아래 "주고받는 데이터 요약"이 이 계약의 출처다.
 * 백엔드가 붙는 날 바꾸는 건 src/api/index.ts 한 줄과 src/api/http/ 뿐이다.
 */
export interface Api {
  listCases(): Promise<CaseSummary[]>;
  getCase(caseId: string): Promise<Case>;
  createCase(): Promise<Case>;
  renameCase(caseId: string, title: string): Promise<void>;
  deleteCase(caseId: string): Promise<void>;

  sendMessage(caseId: string, text: string): Promise<void>;
  uploadVideo(
    caseId: string,
    file: File,
    onProgress: (percent: number) => void,
    signal?: AbortSignal,
  ): Promise<VideoRef>;

  /** 업로드 완료 시 버튼 없이 자동으로 불린다 (02 기능명세서 1.4) */
  analyze(caseId: string): AsyncIterable<AnalyzeEvent>;

  /** 판정에 쓰인 항목이면 재판정된 Verdict를, 아니면 null을 돌려준다 (2.7) */
  patchFact(caseId: string, key: FactKey, value: string): Promise<Verdict | null>;
  answerQuestion(caseId: string, key: FactKey, value: string | null): Promise<void>;
  setOpponentClaim(caseId: string, ratio: Ratio): Promise<void>;

  createStatement(caseId: string): Promise<Statement>;
  rewriteStatement(caseId: string, note: string): Promise<Statement>;
  renderStatementPdf(caseId: string): Promise<void>;

  createRebuttal(caseId: string): Promise<Rebuttal>;
  updateRebuttal(caseId: string, draft: Rebuttal): Promise<Rebuttal>;
  sendRebuttal(caseId: string, draft: Rebuttal): Promise<SentReceipt>;

  listHistory(caseId: string): Promise<HistoryEntry[]>;

  /** 시연·리허설용. 심사 중에 반드시 쓰게 된다 */
  resetDemo(): Promise<void>;
}
