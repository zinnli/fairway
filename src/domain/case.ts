import type { Verdict } from './verdict';

/** 목록 배지 — 규칙 0.5. "재판정중"은 9/3에 빠졌다 */
export type CaseStatus =
  | '접수중' | '분석중' | '확인 필요' | '판정 완료' | '발송 완료' | '종결';

/** 진행 단계 — 규칙 0.6 */
export type StageState = '대기' | '진행중' | '완료';

export interface Stages {
  /** 완료 기준: 영상 분석 요약 도착 (9/3 — 사실 카드가 아니다) */
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

/**
 * 모바일 머리띠가 가리키는 "지금 단계" — 아직 끝나지 않은 첫 단계다.
 * 저장하지 않고 stages에서 파생한다.
 */
export function currentStage(stages: Stages): { step: number; steps: number; label: string } {
  const found = STAGE_LABELS.findIndex(({ key }) => stages[key] !== '완료');
  const at = found === -1 ? STAGE_LABELS.length - 1 : found;
  return { step: at + 1, steps: STAGE_LABELS.length, label: STAGE_LABELS[at].label };
}

export interface VideoRef {
  id: string;
  name: string;
  sizeBytes: number;
  durationSec: number;
  /** 시연에서는 브라우저 로컬 (URL.createObjectURL). 서버가 붙으면 원격 URL */
  objectUrl?: string;
}

export interface Case {
  id: string;
  /** 분석 뒤 AI가 자동으로 붙인다. 그 전에는 null */
  title: string | null;
  status: CaseStatus;
  stages: Stages;
  video: VideoRef | null;
  verdict: Verdict | null;
  accidentAt: string | null;
  accidentPlace: string | null;
  claimNo: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CaseSummary = Pick<Case, 'id' | 'title' | 'status' | 'createdAt' | 'updatedAt'>;

export const emptyStages = (): Stages => ({
  analysis: '대기', verdict: '대기', statement: '대기', rebuttal: '대기',
});
