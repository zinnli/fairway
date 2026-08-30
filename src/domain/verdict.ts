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

/** %p = 비율끼리의 차이 */
export function diffPoints(a: Ratio, b: Ratio): number {
  return a.mine - b.mine;
}

export interface Adjustment {
  label: string;
  /** 내 과실에 더하거나 뺀 값 (%p) */
  delta: number;
}

export interface Precedent {
  /** 심의사례 번호 */
  no: string;
  summary: string;
  /** 일치도 0~1 */
  match: number;
  /** 뒤집힌 사례 — 우선 노출 (02 기능명세서 2.5) */
  isReversed?: boolean;
}

export interface Verdict {
  ratio: Ratio;
  /** 인정기준 도표 */
  chartName: string;
  /** ★ 번호 미확정 (00 문서 5절). null이면 화면에서 번호 칸을 숨긴다 */
  chartNo: string | null;
  baseRatio: Ratio;
  adjustments: Adjustment[];
  /** 한 줄 결론 */
  conclusion: string;
  precedents: Precedent[];
  /** 쟁점 — [잘 모르겠어요]로 남은 항목에서 나온다 */
  disputes: string[];
  /** 상대 보험사 주장 (선택 입력, 02 기능명세서 2.6) */
  opponentClaim?: Ratio;
  createdAt: string;
}
