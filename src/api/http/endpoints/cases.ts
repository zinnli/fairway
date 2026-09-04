import { request } from '../client';
import type { CaseDto, CaseSummaryDto, ListDto } from '../dto';

/** 5-B 사건 */

export const create = () => request<CaseDto>('/cases', { method: 'POST' });

export const list = () => request<ListDto<CaseSummaryDto>>('/cases');

/** 현황판까지 이 한 번에 온다 (v1의 /dashboard가 여기로 합쳐졌다) */
export const get = (caseId: string) => request<CaseDto>(`/cases/${caseId}`);

export const rename = (caseId: string, title: string) =>
  request<CaseDto>(`/cases/${caseId}`, { method: 'PATCH', json: { title } });

export const remove = (caseId: string) =>
  request<void>(`/cases/${caseId}`, { method: 'DELETE' });
