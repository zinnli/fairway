import { request } from '../client';
import type { PrecedentDto, VerdictReadDto } from '../dto';

/** 5-E 판정. 분석 시작·질문·답변은 D-1과 C-2 안에서 일어난다 */

/** 항상 최신 버전. 판정 전이어도 404가 아니다 */
export const get = (caseId: string) => request<VerdictReadDto>(`/cases/${caseId}/verdict`);

/** H37 — 판정 시점에 미리 써 둔 설명문을 읽기만 한다 */
export const precedent = (precedentId: string, caseId: string) =>
  request<PrecedentDto>(
    `/precedents/${encodeURIComponent(precedentId)}?caseId=${encodeURIComponent(caseId)}`,
  );
