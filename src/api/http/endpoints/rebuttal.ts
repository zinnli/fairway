import { newIdempotencyKey, request } from '../client';
import type { JobDto, ListDto, RebuttalDto, SendLogDto, SendResultDto } from '../dto';

/** 5-G 반박의견서 */

export const create = (caseId: string) =>
  request<JobDto>(`/cases/${caseId}/rebuttal`, { method: 'POST' });

export const get = (caseId: string) => request<RebuttalDto>(`/cases/${caseId}/rebuttal`);

/** 바꿀 필드만 보낸다. canSend는 서버가 계산한다 */
export const patch = (
  caseId: string,
  input: Partial<{
    recipient: string;
    claimNumber: string;
    subject: string;
    body: string;
    attachments: { refId: string; included: boolean }[];
  }>,
) => request<RebuttalDto>(`/cases/${caseId}/rebuttal`, { method: 'PATCH', json: input });

/**
 * 발송은 동기다 — 메일 제공자 응답을 기다렸다가 성공/실패가 즉시 온다 (H36 팝업).
 * 멱등키는 필수. [다시 시도]는 **새 키**로 부른다 (§2.5).
 */
/**
 * 명세는 보통 1~3초라 하지만 그건 잘 됐을 때의 값이지 상한이 아니다.
 * 발송이 도는 동안 확인 창은 ×·Esc까지 잠기므로, 물리면 새로고침 말고는
 * 빠져나갈 길이 없다. 시한을 둬서 반드시 끝나게 한다 — 끝나면 h36 팝업이 뜬다.
 */
const SEND_TIMEOUT_MS = 30_000;

export const send = (caseId: string, idempotencyKey = newIdempotencyKey()) =>
  request<SendResultDto>(`/cases/${caseId}/rebuttal/send`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

export const sendLogs = (caseId: string) =>
  request<ListDto<SendLogDto>>(`/cases/${caseId}/rebuttal/sends`);
