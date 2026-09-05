/**
 * 서버 에러 규격 — API 명세 §2.3.
 * 여섯 키는 항상 온다. title·message는 서버가 완성 문장으로 주므로
 * 화면에서 문구를 새로 만들지 않는다.
 */
export interface ApiErrorAction {
  label: string;
  type: 'retry_send' | 'create_report' | 'go_login' | 'go_password_reset' | 'go_case_list';
}

export interface ApiErrorBody {
  code: string;
  title: string;
  message: string;
  retryable: boolean;
  actions: ApiErrorAction[];
  fields: Record<string, string> | null;
}

/** 서버가 규격대로 답한 실패. 규격 밖 실패(네트워크 끊김 등)는 NetworkError다 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(`${body.code}: ${body.message}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }

  get code() {
    return this.body.code;
  }
  get retryable() {
    return this.body.retryable;
  }
  /** 폼 단위 오류 — { email: "이미 가입된 이메일이에요." } */
  get fields() {
    return this.body.fields;
  }
}

/** 규격 밖 실패. 화면에는 서버 문구가 없으니 여기 문장을 쓴다 */
export class NetworkError extends Error {
  constructor(message = '연결이 끊겼어요. 잠시 후 다시 시도해 주세요.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** 규격에 맞는 몸통인지 본다. 프록시가 낀 500처럼 규격 밖 응답이 올 수 있다 */
export function parseErrorBody(status: number, raw: unknown): ApiErrorBody {
  const body = (raw as { error?: Partial<ApiErrorBody> } | null)?.error;
  if (body && typeof body.code === 'string' && typeof body.message === 'string') {
    return {
      code: body.code,
      title: body.title ?? '문제가 생겼어요',
      message: body.message,
      retryable: body.retryable ?? false,
      actions: body.actions ?? [],
      fields: body.fields ?? null,
    };
  }
  return {
    code: 'INTERNAL_ERROR',
    title: '문제가 생겼어요',
    message: `잠시 후 다시 시도해 주세요. (${status})`,
    retryable: true,
    actions: [],
    fields: null,
  };
}
