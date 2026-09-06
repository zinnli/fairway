import type { CaseDto, MessageDto, RebuttalDto } from '../../src/api/http/dto.ts';

/**
 * 목 백엔드가 들고 있는 것 — 프로세스 메모리다.
 * 개발 서버를 다시 띄우면 시드로 돌아간다 (DB를 붙이지 않는다).
 */

export interface CaseRow {
  dto: CaseDto;
  messages: MessageDto[];
  rebuttal: RebuttalDto | null;
  reportVersions: number;
  /** 마지막으로 보낸 기록 (G-5) */
  sends: {
    sendLogId: string;
    sentAt: string;
    fromEmail: string;
    recipient: string;
    subject: string;
    attachmentCount: number;
    attachmentNames: string[];
    result: 'sent' | 'delivered' | 'failed';
  }[];
  /** 이미 처리한 멱등키 → 그때 준 응답 (§2.5) */
  idempotency: Map<string, unknown>;
}

export const cases = new Map<string, CaseRow>();

let n = 0;
/** ULID처럼 보이는 26자리 — 화면은 문자열로만 다루므로 모양만 맞춘다 */
export function newId(prefix = ''): string {
  n += 1;
  const stamp = Date.now().toString(36).toUpperCase();
  const tail = String(n).padStart(4, '0');
  return `${prefix}01J${stamp}${'X'.repeat(Math.max(0, 26 - 3 - stamp.length - tail.length - prefix.length))}${tail}`;
}

/**
 * 시각은 명세 §2.7대로 **KST 오프셋을 달아** 보낸다 — `2026-08-22T18:11:04+09:00`.
 * `toISOString()`은 `Z`로 끝나서 서버가 줄 모양과 다르다.
 */
export function now(): string {
  const kst = new Date(Date.now() + 9 * 3600_000).toISOString();
  return `${kst.slice(0, 19)}+09:00`;
}

export function find(caseId: string): CaseRow | undefined {
  return cases.get(caseId);
}

/** 사건 목록은 최근 것이 위로 (B-1) */
export function sorted(): CaseRow[] {
  return [...cases.values()].sort((a, b) => b.dto.updatedAt.localeCompare(a.dto.updatedAt));
}

export function touch(row: CaseRow) {
  row.dto.updatedAt = now();
}
