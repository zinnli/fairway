import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * 실시간 채널 — 명세 §6. 사건 하나당 채널 하나.
 *
 * 액션 API는 202만 주고 **결과 카드는 전부 여기로 밀어 준다.**
 * 브라우저 목은 함수 호출로 흉내 냈지만, 여기서는 진짜 `text/event-stream`이라
 * 네트워크 탭의 EventStream 칸에 이벤트가 한 줄씩 쌓이는 것을 볼 수 있다.
 */

interface Client {
  caseId: string;
  res: ServerResponse;
}

interface Past {
  id: number;
  at: number;
  caseId: string;
  chunk: string;
}

const clients = new Set<Client>();
/** 끊겼다 붙었을 때 다시 보낼 것 — 명세대로 최근 5분만 들고 있는다 */
const history: Past[] = [];
let seq = 0;

const REPLAY_MS = 5 * 60_000;

function frame(id: number, event: string, data: unknown) {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/** 이 사건을 보고 있는 모두에게 한 줄 밀어 준다 */
export function emit(caseId: string, event: string, data: unknown) {
  const id = ++seq;
  const chunk = frame(id, event, data);
  history.push({ id, at: Date.now(), caseId, chunk });
  while (history.length && Date.now() - history[0].at > REPLAY_MS) history.shift();
  for (const c of clients) if (c.caseId === caseId) c.res.write(chunk);
}

/** 조금 있다가 밀어 준다 — 서버가 생각하는 시간을 흉내 낸다 */
export function emitLater(caseId: string, ms: number, event: string, data: unknown) {
  setTimeout(() => emit(caseId, event, data), ms);
}

export function openStream(caseId: string, req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  /* 프록시가 모아 두면 카드가 늦게 뜬다 */
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const client: Client = { caseId, res };
  clients.add(client);

  res.write(frame(++seq, 'connected', { caseId, serverTime: new Date().toISOString() }));

  /* 끊겼다 브라우저가 스스로 다시 붙으면 Last-Event-ID를 보낸다 — 그 뒤엣것만 다시 준다 */
  const since = Number(req.headers['last-event-id'] ?? 0);
  if (since > 0) {
    for (const p of history) {
      if (p.caseId === caseId && p.id > since) res.write(p.chunk);
    }
  }

  /* 15초마다 주석 한 줄 — 중간의 프록시가 조용한 연결을 끊지 않게 (명세 §6) */
  const beat = setInterval(() => res.write(`: keep-alive ${Date.now()}\n\n`), 15_000);

  const close = () => {
    clearInterval(beat);
    clients.delete(client);
  };
  req.on('close', close);
  req.on('error', close);
}

/** 지금 열려 있는 채널 수 — 시작 안내에 쓴다 */
export const streamCount = () => clients.size;
