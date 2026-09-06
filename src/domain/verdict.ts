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

/** 일치도(%)는 9/3에 뺀 채로 둔다 (04 문서 C5 — 9/6 되살림에 들어가지 않았다) */
export interface Precedent {
  /** 심의사례 번호 */
  no: string;
  summary: string;
  /** 뒤집힌 사례 — 우선 노출 (02 기능명세서 2.5) */
  isReversed?: boolean;
}

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

/**
 * 쟁점(disputes)은 9/3에 빠졌다. 남는 것은 비율 · 한 줄 결론 · 비교 막대 · 근거 목록이다.
 */
export interface Verdict {
  ratio: Ratio;
  /**
   * 상대 보험사가 주장하는 비율. 사용자가 대화에서 말해 준 것을 Agent가 뽑아낸다.
   * **없으면 null이고, 그때는 비교 막대를 그리지 않는다** (명세 §4.6).
   * 견주는 한 줄은 그때도 온다 — 아래 opponentClaimNote를 본다.
   */
  opponentClaim: Ratio | null;
  /**
   * 주장과 판정을 견준 한 줄. **서버가 만들어 주고 늘 온다** —
   * 주장이 없을 때는 "아직 없어요, 채팅으로 알려주시면 …"이 온다.
   * 화면이 %p를 계산하지 않는다. 옛 서버가 안 보내면 빈 문자열이라 줄을 숨긴다.
   */
  opponentClaimNote: string;
  /**
   * 인정기준 도표 — 팝업 없이 근거 목록의 줄 하나로만 쓴다 (h38은 9/3 제외).
   * **번호가 앞에 붙어 온다**("266 · 차대차 회전교차로 사고", 9/6부터).
   * 기준으로 삼은 심의사례가 적용한 도표 번호이지, 따로 검색한 결과가 아니다.
   */
  chartName: string;
  /** 도표가 무엇인지 한 줄 설명. 서버가 준다(basis.chart.note). 없으면 줄을 숨긴다 */
  chartNote: string | null;
  baseRatio: Ratio;
  adjustments: Adjustment[];
  /** 한 줄 결론 */
  conclusion: string;
  precedents: Precedent[];
  createdAt: string;
}
