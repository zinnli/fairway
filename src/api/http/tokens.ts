/**
 * 액세스 토큰 보관 — **메모리에만 둔다.**
 * localStorage는 XSS에 그대로 털린다. 새로고침 뒤에는 refresh 쿠키로 되살린다.
 * refresh 토큰은 httpOnly 쿠키라 자바스크립트가 만질 수 없다.
 */
let accessToken: string | null = null;
/** 토큰이 바뀌면 알려 준다 — 로그인 가드가 이걸 본다 */
const listeners = new Set<(token: string | null) => void>();

export const getToken = () => accessToken;

export function setToken(token: string | null) {
  accessToken = token;
  for (const fn of listeners) fn(token);
}

export function onTokenChange(fn: (token: string | null) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
