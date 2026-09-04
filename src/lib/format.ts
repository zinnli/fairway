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
