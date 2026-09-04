import type { Case, CaseSummary, VideoRef } from '@/domain/case';
import type { Verdict } from '@/domain/verdict';
import type { Rebuttal, SentReceipt, Statement } from '@/domain/document';
import type { ChatMessage, MessageBody } from '@/domain/message';

/**
 * 분석 결과 — 9/3부터 항목 배열이 아니라 글이다.
 * 사고마다 볼 것이 달라 항목 틀로 못 박을 수 없다 (04 문서 C7).
 */
export interface AnalyzeResult {
  /** 영상에서 본 것을 정리한 요약 글. 채팅에 AI 말풍선으로 그대로 붙는다 */
  summary: string;
  /** 판정 전에 더 물어볼 것. 없으면 바로 판정할 수 있다 */
  question: string | null;
}

/**
 * 화면은 이 인터페이스만 안다.
 * 02_기능명세서.md 맨 아래 "주고받는 데이터 요약"이 이 계약의 출처다.
 * 백엔드가 붙는 날 바꾸는 건 src/api/index.ts 한 줄과 src/api/http/ 뿐이다.
 *
 * 9/3에 빠진 것: patchFact · setOpponentClaim · listHistory.
 * 경위서 다시 쓰기(3.2)는 9/4에 되살렸다 — 진행 화면(h31)만 없고 기능은 남는다.
 */
export interface Api {
  listCases(): Promise<CaseSummary[]>;
  getCase(caseId: string): Promise<Case>;
  createCase(): Promise<Case>;
  renameCase(caseId: string, title: string): Promise<void>;
  deleteCase(caseId: string): Promise<void>;

  /** 사건을 열 때 지난 대화를 되살린다. 대화는 추가만 하므로 이게 로그의 시작이다 */
  listMessages(caseId: string): Promise<ChatMessage[]>;
  /**
   * 화면이 만든 카드를 로그에 남긴다 (되물음·내 대답처럼 서버가 모르는 것).
   * 업로드 중·분석 중처럼 지나가는 카드는 남기지 않는다.
   */
  appendMessage(caseId: string, body: MessageBody): Promise<void>;
  sendMessage(caseId: string, text: string): Promise<void>;
  uploadVideo(caseId: string, file: File, onProgress: (percent: number) => void): Promise<VideoRef>;

  /** 업로드 완료 시 버튼 없이 자동으로 불린다 (02 기능명세서 1.4) */
  analyze(caseId: string): Promise<AnalyzeResult>;
  /** 되물음에 글로 답한다. 더 물을 게 남았으면 다음 질문을, 없으면 null을 준다 */
  answerQuestion(caseId: string, text: string): Promise<{ question: string | null }>;
  /** 더 물을 게 없을 때 판정을 청한다 */
  judge(caseId: string): Promise<Verdict>;

  createStatement(caseId: string): Promise<Statement>;
  /**
   * 경위서를 다시 쓴다 (h26·h28·h30). 버전이 하나 오른 새 문서가 온다.
   * instruction은 h30 전문 창에서 적는 요청("2번을 더 간단하게"). 없이도 부를 수 있다.
   */
  rewriteStatement(caseId: string, instruction?: string): Promise<Statement>;
  renderStatementPdf(caseId: string): Promise<void>;

  createRebuttal(caseId: string): Promise<Rebuttal>;
  updateRebuttal(caseId: string, draft: Rebuttal): Promise<Rebuttal>;
  sendRebuttal(caseId: string, draft: Rebuttal): Promise<SentReceipt>;

  /** 시연·리허설용. 심사 중에 반드시 쓰게 된다 */
  resetDemo(): Promise<void>;
}
