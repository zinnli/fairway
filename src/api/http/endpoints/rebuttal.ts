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
export const send = (caseId: string, idempotencyKey = newIdempotencyKey()) =>
  request<SendResultDto>(`/cases/${caseId}/rebuttal/send`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
  });

export const sendLogs = (caseId: string) =>
  request<ListDto<SendLogDto>>(`/cases/${caseId}/rebuttal/sends`);
