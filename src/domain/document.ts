/** 경위서 한 절의 근거 한 조각 — 색점은 출처 태그 규칙(0.3)을 따른다 */
export interface SectionSource {
  label: string;
  /** 'ref'는 도표·심의사례라 색점이 없다 */
  source: 'video' | 'statement' | 'unknown' | 'ref';
}

export interface StatementSection {
  title: string;
  body: string;
  /** "근거: ●영상(차선·신호) · ●내가 말한 것(충돌 부위)" (h30) */
  sources: SectionSource[];
}

/** 사건경위서 — 02 기능명세서 3장 */
export interface Statement {
  version: number;
  /** ①일시·장소 ②사고 경위 ③영상 분석 결과 ④주장 요지 */
  sections: StatementSection[];
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
