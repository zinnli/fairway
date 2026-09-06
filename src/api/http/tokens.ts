/**
 * 액세스 토큰 보관 — **메모리에만 둔다.**
 * localStorage는 XSS에 그대로 털린다. 새로고침 뒤에는 refresh 쿠키로 되살린다.
 * refresh 토큰은 httpOnly 쿠키라 자바스크립트가 만질 수 없다.
 */
let accessToken: string | null = null;

export const getToken = () => accessToken;

export function setToken(token: string | null) {
  accessToken = token;
}
