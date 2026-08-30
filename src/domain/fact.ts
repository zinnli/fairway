import { REQUIRED_FACT_KEYS } from '@/config';

/** 출처 태그 — 규칙 0.3. 사용자가 고치면 'statement'로 바뀐다 */
export type FactSource = 'video' | 'statement' | 'unknown';

export const FACT_SOURCE_LABEL: Record<FactSource, string> = {
  video: '영상',
  statement: '내가 말한 것',
  unknown: '확인 필요',
};

/** 필수 6가지 = "확인된 사실 N / 6"의 분모 (02 기능명세서 2.x) */
export type FactKey = (typeof REQUIRED_FACT_KEYS)[number];

export const FACT_LABEL: Record<FactKey, string> = {
  myLane: '내 차선·진행',
  opponentEntry: '상대 진입 방향',
  opponentSignal: '상대 신호',
  mySpeed: '내 속도',
  impactPoint: '충돌 부위',
  stopLineTiming: '정지선 통과 시점',
};

export interface Fact {
  key: FactKey;
  value: string | null;
  source: FactSource;
  /** AI 확신도 0~1. 사용자가 고치면 undefined */
  confidence?: number;
  /** 판정 카드의 "쟁점" 줄로 이어지는 항목 */
  isDisputed?: boolean;
}

/**
 * 확인된 사실 개수는 저장하지 말고 파생한다.
 * 상태로 들고 있으면 재판정 때 반드시 어긋난다.
 */
export function countConfirmed(facts: Fact[]): { confirmed: number; total: number; disputed: number } {
  return {
    confirmed: facts.filter((f) => f.source !== 'unknown' && f.value !== null).length,
    total: REQUIRED_FACT_KEYS.length,
    disputed: facts.filter((f) => f.isDisputed).length,
  };
}

/** 화면 문구 한 벌 — "확인된 사실 5 / 6 · 남은 1개는 쟁점이에요" */
export function factCountLabel(facts: Fact[]): string {
  const { confirmed, total, disputed } = countConfirmed(facts);
  const tail = disputed > 0 ? ` · 남은 ${disputed}개는 쟁점이에요` : '';
  return `확인된 사실 ${confirmed} / ${total}${tail}`;
}
