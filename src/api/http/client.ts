import { ApiError, NetworkError, parseErrorBody } from './error';
import { getToken, setToken } from './tokens';

/**
 * 전송 계층 — 여기까지가 api 로직이다. 도메인 타입을 모른다.
 *
 * · 모든 요청에 credentials: 'include' (세 환경 모두 프론트와 API의 출처가 다르다)
 * · 401이면 /auth/refresh 한 번 → 원 요청 재시도
 * · 동시에 여러 요청이 401을 맞아도 refresh는 한 번만 나간다 (single-flight)
 */

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? 'http://localhost/api/v1';

/** 스트리밍 URL은 BASE에서 /api/v1을 뗀 원점에 붙인다 */
export const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, '');

/** 로그인이 완전히 풀렸을 때 부른다 — 라우터가 로그인 화면으로 보낸다 */
let onSessionLost: (() => void) | null = null;
export const setSessionLostHandler = (fn: (() => void) | null) => {
  onSessionLost = fn;
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** JSON 본문. FormData를 보낼 때는 body를 쓴다 */
  json?: unknown;
  body?: BodyInit;
  headers?: Record<string, string>;
  /** 인증이 필요 없는 길 (로그인·회원가입·약관). refresh 재시도를 하지 않는다 */
  anonymous?: boolean;
  signal?: AbortSignal;
}

/* refresh는 한 번만 — 여러 요청이 동시에 401을 맞아도 이 약속 하나를 같이 기다린다 */
let refreshing: Promise<boolean> | null = null;

async function refreshOnce(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken?: string };
      if (!data.accessToken) return false;
      setToken(data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      /* 다음 401은 새로 갱신을 시도할 수 있어야 한다 */
      setTimeout(() => {
        refreshing = null;
      }, 0);
    }
  })();
  return refreshing;
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { ...options.headers };
  const token = getToken();
  if (token && !options.anonymous) headers.Authorization = `Bearer ${token}`;

  let body = options.body;
  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json; charset=utf-8';
    body = JSON.stringify(options.json);
  }

  try {
    return await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers,
      body,
      signal: options.signal,
    });
  } catch {
    throw new NetworkError();
  }
}

/**
 * 요청 한 번. 204면 undefined를 돌려준다.
 * 타입 인자는 호출하는 쪽이 명세를 보고 붙인다 — 여기서는 검사하지 않는다.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options);

  /* 액세스 토큰이 30분마다 만료된다. 한 번 갱신하고 그대로 다시 보낸다 */
  if (res.status === 401 && !options.anonymous) {
    const revived = await refreshOnce();
    if (revived) {
      res = await send(path, options);
    } else {
      setToken(null);
      onSessionLost?.();
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  /* 프록시가 낀 502처럼 JSON이 아닌 몸통이 올 수 있다 — SyntaxError를 규격 밖으로
     흘리지 않는다. 오류 응답이면 parseErrorBody가 기본 문구로 채운다 */
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (res.ok) throw new NetworkError();
    }
  }

  if (!res.ok) throw new ApiError(res.status, parseErrorBody(res.status, data));
  return data as T;
}

/**
 * 업로드 — 진행률 때문에 fetch가 아니라 XHR을 쓴다.
 * fetch는 업로드 진행률을 주지 못한다 (명세 §8.2가 upload.onprogress를 전제한다).
 */
export function upload<T>(
  path: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<T> {
  const run = (token: string | null) =>
    new Promise<{ status: number; text: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}${path}`);
      xhr.withCredentials = true;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
      xhr.onerror = () => reject(new NetworkError());
      xhr.onabort = () => reject(new NetworkError('업로드가 중단됐어요.'));

      const form = new FormData();
      form.append('file', file);
      xhr.send(form);
    });

  const finish = async (r: { status: number; text: string }): Promise<T> => {
    const data: unknown = r.text ? JSON.parse(r.text) : null;
    if (r.status < 200 || r.status >= 300) {
      throw new ApiError(r.status, parseErrorBody(r.status, data));
    }
    return data as T;
  };

  return run(getToken()).then(async (r) => {
    if (r.status !== 401) return finish(r);
    /* 큰 파일을 올리는 동안 토큰이 만료될 수 있다. 갱신하고 한 번 더 올린다 */
    const revived = await refreshOnce();
    if (!revived) {
      setToken(null);
      onSessionLost?.();
      return finish(r);
    }
    onProgress(0);
    return run(getToken()).then(finish);
  });
}

/**
 * 파일 하나를 받아 온다 — PDF처럼 본문이 JSON이 아닌 길 (명세 F-6).
 *
 * **인증 헤더를 반드시 붙인다.** 액세스 토큰은 메모리에만 있어서 쿠키로 가지 않는다.
 * 안 붙이면 서버가 401 JSON을 주는데, 그걸 그대로 저장하면 이름만 .pdf인
 * "받아지긴 했는데 열리지 않는" 파일이 떨어진다.
 *
 * `url`은 절대 주소다 — 서버가 준 downloadUrl을 그대로 쓰기 위해서다.
 */
export async function downloadFile(url: string): Promise<Blob> {
  const run = async () => {
    const token = getToken();
    try {
      return await fetch(url, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      throw new NetworkError();
    }
  };

  let res = await run();
  if (res.status === 401) {
    const revived = await refreshOnce();
    if (revived) {
      res = await run();
    } else {
      setToken(null);
      onSessionLost?.();
    }
  }

  if (!res.ok) {
    const text = await res.text();
    let data: unknown = null;
    /* 오류 본문이 JSON이 아닐 수도 있다 (프록시가 낸 HTML 등) */
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    throw new ApiError(res.status, parseErrorBody(res.status, data));
  }
  return res.blob();
}

/** SSE처럼 fetch 밖에서 토큰이 만료됐을 때 쓴다. 위와 같은 single-flight를 탄다 */
export const refreshAccessToken = () => refreshOnce();

/** 발송 멱등키 — 명세 §2.5. [다시 시도]는 새 키로 부른다 */
export const newIdempotencyKey = () => crypto.randomUUID();
