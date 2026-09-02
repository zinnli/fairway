import type { ErrorCode } from '@/domain/message';

/**
 * 화면에 그대로 보여 줄 수 있는 오류.
 * 규칙 0.7 — 무엇이 안 됐는지 + 어떻게 하면 되는지가 message 하나에 들어간다.
 * [다시 시도]는 카드가 붙인다.
 */
export class ApiError extends Error {
  /* 매개변수 프로퍼티(readonly code)는 erasableSyntaxOnly에서 못 쓴다 */
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

const FALLBACK = '알 수 없는 문제로 실패했어요. 잠시 뒤 다시 시도해 주세요.';

/** 무엇이 튀어나오든 화면이 읽을 수 있는 모양으로 바꾼다 */
export function toApiError(e: unknown, code: ErrorCode): ApiError {
  return e instanceof ApiError ? e : new ApiError(code, FALLBACK);
}
