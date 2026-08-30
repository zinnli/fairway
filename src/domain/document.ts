/** 사건경위서 — 02 기능명세서 3장 */
export interface Statement {
  version: number;
  /** ①일시·장소 ②사고 경위 ③영상 분석 결과 ④주장 요지 */
  sections: { title: string; body: string }[];
  /** 초안 카드에 표시 */
  pageCount: number;
  reflectedMessageCount: number;
  updatedAt: string;
}

/** 반박의견서 — 02 기능명세서 4장 */
export interface Rebuttal {
  to: string;
  subject: string;
  body: string;
  attachments: { id: string; label: string; included: boolean }[];
  sentAt: string | null;
}

export interface SentReceipt {
  at: string;
  to: string;
}
