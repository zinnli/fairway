/**
 * 비율은 항상 "나 : 상대" 순서 (규칙 0.1).
 * 숫자만 쓰지 않는다 — 반드시 formatRatio()를 거친다.
 */
export interface Ratio {
  mine: number;
  opponent: number;
}

export function formatRatio(r: Ratio): string {
  return `나 ${r.mine} : 상대 ${r.opponent}`;
}

export interface Adjustment {
  label: string;
  /** 내 과실에 더하거나 뺀 값 (%p) */
  delta: number;
}

/** 일치도(%)는 9/3에 빠졌다 (04 문서 C5) */
export interface Precedent {
  /** 심의사례 번호 */
  no: string;
  summary: string;
  /** 뒤집힌 사례 — 우선 노출 (02 기능명세서 2.5) */
  isReversed?: boolean;
}

/**
 * 쟁점(disputes)·상대 주장(opponentClaim)은 9/3에 빠졌다.
 * 남는 것은 비율 · 한 줄 결론 · 근거 목록뿐이다.
 */
/**
 * 심의사례 팝업(h37)이 받는 것. 그림은 있을 수도 없을 수도 있다.
 * bodyText는 빈 줄로 나뉜 문단이고, 소제목도 문단 하나로 섞여 온다 —
 * 화면이 문단 글자를 보고 소제목을 알아본다.
 */
export interface PrecedentDetail {
  bodyText: string;
  /** 바로 <img src>에 넣을 수 있는 주소. 서명이 붙어 있고 10분간 유효하다 */
  imageUrl: string | null;
  imageCaption: string | null;
}

export interface Verdict {
  ratio: Ratio;
  /** 인정기준 도표 — 팝업 없이 근거 목록의 줄 하나로만 쓴다 (h38은 9/3 제외) */
  chartName: string;
  /** 도표가 무엇인지 한 줄 설명. 서버가 준다(basis.chart.note). 없으면 줄을 숨긴다 */
  chartNote: string | null;
  /** ★ 번호 미확정 (00 문서 5절). null이면 화면에서 번호 칸을 숨긴다 */
  chartNo: string | null;
  baseRatio: Ratio;
  adjustments: Adjustment[];
  /** 한 줄 결론 */
  conclusion: string;
  precedents: Precedent[];
  createdAt: string;
}
