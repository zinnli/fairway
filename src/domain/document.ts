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
  /** 카드에 보여 줄 미리보기 줄. 서버가 문장으로 준다 — 없으면 sections에서 만든다 */
  preview?: string[];
  updatedAt: string;
}

/** 반박의견서 — 02 기능명세서 4장 */
export interface Rebuttal {
  to: string;
  /**
   * 보험사 접수번호. 이게 있어야 보험사가 사건을 찾는다 —
   * 서버는 이걸로 제목을 자동으로 만든다(명세 G-2 `subjectAuto`).
   * 여태 화면 안에만 있어서 서버로 넘어가지 않았다 (9/5 수정).
   */
  claimNo: string | null;
  subject: string;
  body: string;
  attachments: {
    id: string;
    label: string;
    included: boolean;
    /** 서버가 붙인 사정. 첨부 합계가 25MB를 넘으면 영상이 빠지고 이유가 온다 (명세 §8.1) */
    note?: string | null;
  }[];
  sentAt: string | null;
}

export interface SentReceipt {
  at: string;
  to: string;
}
