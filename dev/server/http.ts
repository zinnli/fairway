import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * 개발용 목 백엔드의 밑바닥 — 라우팅·본문 읽기·응답 규격.
 *
 * **브라우저 안에서 도는 목(`src/api/mock/`)과는 다른 물건이다.**
 * 그쪽은 화면이 서비스 인터페이스만 보고 부르는 것이라 네트워크에 아무것도 남지 않는다.
 * 이쪽은 개발 서버가 진짜 HTTP로 답하므로, 네트워크 탭에 요청·헤더·본문·SSE가 그대로 찍히고
 * 전송 계층(`client.ts`)과 DTO 매핑(`map.ts`)까지 함께 굴러간다.
 *
 * 이 폴더는 `src/`가 아니라 개발 서버에서만 읽힌다 — 앱 번들에는 한 줄도 들어가지 않는다.
 */

export interface Ctx {
  params: Record<string, string>;
  query: URLSearchParams;
  /** JSON 본문. 본문이 없으면 null */
  body: unknown;
  req: IncomingMessage;
  res: ServerResponse;
}

export type Handler = (ctx: Ctx) => unknown | Promise<unknown>;

export interface Route {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  /** 인증이 필요 없는 길 (로그인·회원가입·약관·헬스체크) */
  anonymous?: boolean;
  /** 응답을 직접 쓴다 (SSE·파일) — 돌려주는 값을 JSON으로 감싸지 않는다 */
  raw?: boolean;
  status?: number;
  handler: Handler;
}

/** `/cases/:caseId/messages` → 정규식 + 이름표 */
function compile(path: string) {
  const names: string[] = [];
  const source = path.replace(/:([A-Za-z]+)/g, (_, name: string) => {
    names.push(name);
    return '([^/]+)';
  });
  return { re: new RegExp(`^${source}$`), names };
}

/** 규격 오류 — 명세 §2.4의 봉투 그대로 (throw 하면 라우터가 받아 쓴다) */
export interface ErrorBody {
  code: string;
  title: string;
  message: string;
  retryable?: boolean;
  actions?: { label: string; type: string }[] | null;
  fields?: Record<string, string> | null;
}

export class HttpError extends Error {
  status: number;
  body: ErrorBody;

  constructor(status: number, body: ErrorBody) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

export const fail = (
  status: number,
  code: string,
  title: string,
  message: string,
  extra: Partial<ErrorBody> = {},
) => new HttpError(status, { code, title, message, retryable: false, actions: null, fields: null, ...extra });

/** 명세 §2.1 — 응답은 봉투 없이 알맹이만. 오류일 때만 `error`로 감싼다 */
export function send(res: ServerResponse, status: number, body: unknown) {
  if (status === 204 || body === undefined) {
    res.statusCode = status;
    res.end();
    return;
  }
  const text = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(text));
  res.end(text);
}

export function sendError(res: ServerResponse, e: HttpError) {
  send(res, e.status, {
    error: {
      retryable: false,
      actions: null,
      fields: null,
      ...e.body,
    },
  });
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

/** 사람 손 속도로 늦춘다 — 즉시 답하면 로딩·잠금이 언제 도는지 볼 수 없다 */
export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RouterOptions {
  /** 인증이 필요한 길에서 토큰을 확인한다. 통과하지 못하면 401 */
  authorize: (req: IncomingMessage) => void;
  /** 응답을 늦출 밀리초 */
  latency: (route: Route) => number;
  log: (line: string) => void;
}

export function createRouter(routes: Route[], options: RouterOptions) {
  const compiled = routes.map((r) => ({ ...r, ...compile(r.path) }));

  return async function handle(req: IncomingMessage, res: ServerResponse, next: () => void) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const method = (req.method ?? 'GET').toUpperCase();
    const hit = compiled.find((r) => r.method === method && r.re.test(url.pathname));
    if (!hit) {
      /* 목이 아직 모르는 길이다. 조용히 404를 주면 화면이 엉뚱한 곳을 헤매므로 남긴다 */
      options.log(`${method} ${url.pathname} → 404 (목에 없는 길)`);
      sendError(
        res,
        fail(404, 'NOT_FOUND', '찾을 수 없어요', '개발용 목 서버에 아직 없는 길이에요.'),
      );
      return;
    }

    const matched = hit.re.exec(url.pathname)!;
    const params: Record<string, string> = {};
    hit.names.forEach((name, i) => (params[name] = decodeURIComponent(matched[i + 1])));

    try {
      if (!hit.anonymous) options.authorize(req);

      let body: unknown = null;
      const type = req.headers['content-type'] ?? '';
      if (method !== 'GET' && !hit.raw) {
        const raw = await readBody(req);
        if (raw.length && type.includes('application/json')) body = JSON.parse(raw.toString());
        /* 멀티파트는 파싱하지 않는다 — 크기만 세어 업로드처럼 굴린다 */
        else if (raw.length) body = { multipartBytes: raw.length };
      }

      const ms = options.latency(hit);
      if (ms > 0) await wait(ms);

      const result = await hit.handler({ params, query: url.searchParams, body, req, res });
      if (hit.raw) return;
      const status = hit.status ?? (result === undefined ? 204 : 200);
      options.log(`${method} ${url.pathname} → ${status}`);
      send(res, status, result);
    } catch (e) {
      if (e instanceof HttpError) {
        options.log(`${method} ${url.pathname} → ${e.status} ${e.body.code}`);
        sendError(res, e);
        return;
      }
      options.log(`${method} ${url.pathname} → 500 ${String(e)}`);
      sendError(
        res,
        fail(500, 'INTERNAL', '문제가 생겼어요', '개발용 목 서버에서 오류가 났어요.', {
          retryable: true,
        }),
      );
    }
    void next;
  };
}
