import type { Fact } from './fact';
import type { Ratio, Verdict } from './verdict';

/** 목록 배지 — 규칙 0.5 */
export type CaseStatus =
  | '접수중' | '분석중' | '확인 필요' | '판정 완료' | '재판정중' | '발송 완료' | '종결';

/** 진행 단계 — 규칙 0.6 */
export type StageState = '대기' | '진행중' | '완료';

export interface Stages {
  /** 완료 기준: 사실 카드 도착 */
  analysis: StageState;
  /** 완료 기준: 판정 카드 도착 */
  verdict: StageState;
  /** 완료 기준: 초안 생성 (PDF 저장이 아니다) */
  statement: StageState;
  /** 완료 기준: 발송 성공 */
  rebuttal: StageState;
}

export const STAGE_LABELS: { key: keyof Stages; label: string }[] = [
  { key: 'analysis', label: '사건 분석' },
  { key: 'verdict', label: '과실비율' },
  { key: 'statement', label: '사건경위서' },
  { key: 'rebuttal', label: '반박의견서' },
];

export interface VideoRef {
  id: string;
  name: string;
  sizeBytes: number;
  durationSec: number;
  /** 시연에서는 브라우저 로컬 (URL.createObjectURL). 서버가 붙으면 원격 URL */
  objectUrl?: string;
}

/** 변경 이력 — 02 기능명세서 5.2 */
export interface HistoryEntry {
  id: string;
  at: string;
  kind: 'fact' | 'verdict' | 'statement' | 'pdf' | 'send';
  /** "상대 신호: 적색 → 황색 (내가 말한 것)" */
  text: string;
}

export interface Case {
  id: string;
  /** 분석 뒤 AI가 자동으로 붙인다. 그 전에는 null */
  title: string | null;
  status: CaseStatus;
  stages: Stages;
  facts: Fact[];
  video: VideoRef | null;
  verdict: Verdict | null;
  /** 재판정 전 판정 — 새 카드에서 나란히 보여 준다 */
  previousRatio: Ratio | null;
  accidentAt: string | null;
  accidentPlace: string | null;
  claimNo: string | null;
  history: HistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export type CaseSummary = Pick<Case, 'id' | 'title' | 'status' | 'createdAt' | 'updatedAt'>;

export const emptyStages = (): Stages => ({
  analysis: '대기', verdict: '대기', statement: '대기', rebuttal: '대기',
});
