import { API_BASE, refreshAccessToken } from './client';
import type { CaseDto, MessageDto } from './dto';
import { getToken } from './tokens';

/**
 * 실시간 채널 — 명세 §6. 사건 하나당 채널 하나.
 * 액션 API는 202만 주고 **결과 카드는 전부 여기로 들어온다. 폴링하지 않는다.**
 *
 * EventSource는 헤더를 못 붙이므로 토큰을 쿼리로 넘긴다.
 * 끊겼다 붙으면 브라우저가 Last-Event-ID를 자동으로 보내고 서버가 최근 5분을 재전송한다 —
 * **같은 EventSource가 알아서 다시 붙을 때만이다.** 토큰이 만료돼 우리가 새로 여는
 * 재접속에는 재전송이 없으므로, 성공하면 regained로 알려 화면이 다시 읽게 한다.
 */

export interface CaseEventHandlers {
  connected?: (data: { caseId: string; serverTime: string }) => void;
  messageCreated?: (message: MessageDto) => void;
  messageUpdated?: (message: MessageDto) => void;
  caseUpdated?: (item: CaseDto) => void;
  rebuttalSent?: (data: { sendLogId: string; sentAt: string; recipient: string }) => void;
  /** 토큰을 갱신해 새로 연 채널이 붙었다. 끊긴 사이 이벤트는 재전송되지 않았다 */
  regained?: () => void;
  /** 채널이 끊겼고 되살리지 못했다. 화면은 B-3·C-1을 다시 불러 맞춘다 */
  lost?: () => void;
}

const parse = <T,>(e: MessageEvent): T | null => {
  try {
    return JSON.parse(e.data as string) as T;
  } catch {
    return null;
  }
};

export function subscribeCase(caseId: string, on: CaseEventHandlers): () => void {
  let source: EventSource | null = null;
  let closed = false;
  /* 토큰이 만료돼 끊긴 것인지 한 번만 되짚는다. 두 번째부터는 포기하고 화면에 맡긴다 */
  let refreshed = false;
  /* 우리가 새로 연 접속인가 — 붙으면 regained를 울려야 한다 */
  let reopened = false;

  const open = () => {
    if (closed) return;
    const token = getToken();
    const url = `${API_BASE}/cases/${caseId}/events${token ? `?access_token=${encodeURIComponent(token)}` : ''}`;
    source = new EventSource(url, { withCredentials: true });

    source.addEventListener('connected', (e) => {
      refreshed = false;
      const data = parse<{ caseId: string; serverTime: string }>(e as MessageEvent);
      if (data) on.connected?.(data);
      if (reopened) {
        reopened = false;
        on.regained?.();
      }
    });
    source.addEventListener('message.created', (e) => {
      const data = parse<MessageDto>(e as MessageEvent);
      if (data) on.messageCreated?.(data);
    });
    source.addEventListener('message.updated', (e) => {
      const data = parse<MessageDto>(e as MessageEvent);
      if (data) on.messageUpdated?.(data);
    });
    source.addEventListener('case.updated', (e) => {
      const data = parse<CaseDto>(e as MessageEvent);
      if (data) on.caseUpdated?.(data);
    });
    source.addEventListener('rebuttal.sent', (e) => {
      const data = parse<{ sendLogId: string; sentAt: string; recipient: string }>(
        e as MessageEvent,
      );
      if (data) on.rebuttalSent?.(data);
    });

    source.onerror = () => {
      /* CONNECTING이면 브라우저가 알아서 다시 붙는 중이다 — 건드리지 않는다 */
      if (closed || source?.readyState !== EventSource.CLOSED) return;
      source.close();
      source = null;
      if (refreshed) {
        on.lost?.();
        return;
      }
      refreshed = true;
      void refreshAccessToken().then((ok) => {
        if (closed) return;
        if (!ok) {
          on.lost?.();
          return;
        }
        reopened = true;
        open();
      });
    };
  };

  open();

  return () => {
    closed = true;
    source?.close();
    source = null;
  };
}
