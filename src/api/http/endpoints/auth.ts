import { request } from '../client';
import type { LegalDocDto, SessionDto, UserDto } from '../dto';

/** 5-A 인증과 계정. 경로와 모양만 안다 — 토큰을 어디에 넣을지는 service가 정한다 */

export const signup = (input: {
  email: string;
  password: string;
  passwordConfirm: string;
  agreements: { termsOfService: boolean; privacy: boolean; videoConsent: boolean };
}) => request<SessionDto>('/auth/signup', { method: 'POST', json: input, anonymous: true });

export const login = (input: { email: string; password: string }) =>
  request<SessionDto>('/auth/login', { method: 'POST', json: input, anonymous: true });

export const logout = () => request<void>('/auth/logout', { method: 'POST' });

/** 쿠키만으로 동작한다. 본문도 헤더도 필요 없다 */
export const refresh = () =>
  request<{ accessToken: string; expiresIn: number }>('/auth/refresh', {
    method: 'POST',
    anonymous: true,
  });

export const me = () =>
  request<
    UserDto & {
      agreements: Record<string, { agreed: boolean; agreedAt: string }>;
    }
  >('/auth/me');

export const emailAvailable = (email: string) =>
  request<{ available: boolean; reason: string | null }>(
    `/auth/email-available?email=${encodeURIComponent(email)}`,
    { anonymous: true },
  );

export const requestPasswordReset = (email: string) =>
  request<{ message: string }>('/auth/password-reset', {
    method: 'POST',
    json: { email },
    anonymous: true,
  });

export const confirmPasswordReset = (input: {
  token: string;
  password: string;
  passwordConfirm: string;
}) =>
  request<{ message: string }>('/auth/password-reset/confirm', {
    method: 'POST',
    json: input,
    anonymous: true,
  });

/** ★ A-9 체험 계정은 보류다 (부록 B-1). 붙는 날 이 줄만 쓰면 된다 */
export const demoLogin = () =>
  request<SessionDto>('/auth/demo', { method: 'POST', anonymous: true });

export const completeOnboarding = (input: { completed: boolean; skipped: boolean }) =>
  request<{ onboardedAt: string }>('/users/me/onboarding', { method: 'PATCH', json: input });

export const legal = (docType: 'terms' | 'privacy' | 'video-consent') =>
  request<LegalDocDto>(`/legal/${docType}`, { anonymous: true });
