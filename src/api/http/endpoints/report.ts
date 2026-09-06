import { request } from '../client';
import type { JobDto, ReportFullDto, ReportPdfDto } from '../dto';

/** 5-F 사건경위서. 만들기·다시 쓰기는 202 — 결과는 SSE로 온다 */

export const create = (caseId: string) =>
  request<JobDto & { version: number }>(`/cases/${caseId}/report`, { method: 'POST' });

export const full = (caseId: string, version: number | 'latest' = 'latest') =>
  request<ReportFullDto>(`/cases/${caseId}/report/versions/${version}`);

/** UPDATE가 아니라 새 버전 INSERT. 진행 화면(H31)이 없어 로딩만 그린다 */
export const revise = (caseId: string, revisionRequest: string) =>
  request<JobDto & { fromVersion: number; toVersion: number }>(
    `/cases/${caseId}/report/revisions`,
    { method: 'POST', json: { request: revisionRequest } },
  );

/** 이미 있으면 200으로 같은 본문이 온다 (재생성하지 않는다) */
export const createPdf = (caseId: string, version: number) =>
  request<ReportPdfDto>(`/cases/${caseId}/report/versions/${version}/pdf`, { method: 'POST' });
