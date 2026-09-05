import { request } from '../client';
import type { MessageDto, MessageListDto } from '../dto';

/** 5-C 채팅. POST는 입력창 전용이다 — 카드 안 버튼은 자원 API를 직접 부른다 */

export const list = (caseId: string, params: { before?: string; limit?: number } = {}) => {
  const q = new URLSearchParams();
  if (params.before) q.set('before', params.before);
  if (params.limit) q.set('limit', String(params.limit));
  const query = q.toString();
  return request<MessageListDto>(`/cases/${caseId}/messages${query ? `?${query}` : ''}`);
};

/** 202. 유저 메시지만 즉시 오고 AI 답은 SSE로 온다 */
export const send = (caseId: string, text: string) =>
  request<{ message: MessageDto; assistantPending: boolean }>(`/cases/${caseId}/messages`, {
    method: 'POST',
    json: { text },
  });
