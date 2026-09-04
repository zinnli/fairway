/** 절마다 붙던 근거 줄(0.3 출처 태그)은 9/3에 빠졌다 — 본문만 남는다 */
export interface StatementSection {
  title: string;
  body: string;
}

/** 사건경위서 — 02 기능명세서 3장. 반영 대화 수는 9/3에 빠졌다 (04 문서 C9) */
export interface Statement {
  version: number;
  /** ①일시·장소 ②사고 경위 ③영상 분석 결과 ④주장 요지 */
  sections: StatementSection[];
  /** 초안 카드에 표시 */
  pageCount: number;
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
