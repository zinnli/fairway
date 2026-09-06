/**
 * 화면에 보이는 숫자 문구 — 시안이 쓰는 형태 그대로.
 * 숫자는 tnum(tabular-nums)으로 세로줄을 맞춘다.
 */

/** 18MB · 340MB — 소수점 없이. 1MB 미만도 1MB로 올린다(0MB는 뜻이 없다) */
export function mb(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / (1024 * 1024)))}MB`;
}

/** 42초 · 1분 22초 · 3분 */
export function durationLabel(sec: number): string {
  const total = Math.round(sec);
  if (total < 60) return `${total}초`;
  const m = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${m}분` : `${m}분 ${rest}초`;
}

/**
 * AI 되물음 끝에 붙는 순번을 떼어 낸다 — "…충돌했나요? 1/2" (h20b · 명세 §4).
 * 서버가 순번을 **문장 안에** 넣어 보내므로, 화면이 갈라서 정보 글자로 돌린다.
 *
 * 한 자리 수 두 개가 문장 맨 끝에 올 때만 순번으로 본다. 날짜(09/06)나
 * 앞뒤가 뒤집힌 값(3/2)을 순번으로 잘못 읽지 않게 막는다.
 *
 * **앞이 문장으로 끝나야 한다** — 순번은 다 쓴 문장 뒤에 덧붙는 것이라
 * 문장부호로 끝난다. 이 조건이 없으면 "…분담 비율은 3/7" 같은 글의 꼬리를
 * 잘라 진행 표시로 둔갑시킨다.
 */
export function splitQuestionCount(text: string): { body: string; count: string | null } {
  const m = /\s*\(?([1-9])\s*\/\s*([1-9])\)?[.\s]*$/.exec(text);
  if (!m || Number(m[1]) > Number(m[2])) return { body: text, count: null };
  const body = text.slice(0, m.index).trimEnd();
  if (!/[.?!…]$/.test(body)) return { body: text, count: null };
  return { body, count: `${m[1]}/${m[2]}` };
}

/**
 * 온점 뒤에서 줄을 바꾼다 — 문장 하나에 한 줄.
 *
 * 줄바꿈은 원래 **AI가 넣어 보내기로 한 것**이라 화면은 `whitespace-pre-line`으로
 * 살리기만 했는데(AiText), 실제로는 넣어 줄 때도 있고 안 넣어 줄 때도 있다.
 * 그래서 화면이 맞춰 준다 — **이미 줄이 바뀌어 있으면 손대지 않는다.**
 * 온점 뒤가 공백일 때만 그 공백을 줄바꿈으로 바꾸므로 줄이 두 번 벌어지지 않는다.
 *
 * 건드리지 않는 것:
 * - `3.5초` `abc.mp4` — 온점 뒤에 공백이 없다
 * - `1. 사고 경위` — 온점 앞이 숫자다(번호 매김)
 * - `...` `…` — 온점 앞이 온점이다
 * - 물음표·느낌표 — 온점만 다룬다
 */
export function breakSentences(text: string): string {
  return text.replace(/([^.\d])\.[ \t]+(?=\S)/g, '$1.\n');
}
