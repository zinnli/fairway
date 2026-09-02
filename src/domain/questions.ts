import type { FactKey } from './fact';
import type { Chip } from './message';

/**
 * 되물을 때 쓰는 칩 — h20. 시안이 보여 주는 두 항목만 칩이 있고,
 * 나머지는 칩 없이 글로 답하게 둔다(없는 보기를 지어내지 않는다).
 * [잘 모르겠어요]를 고르면 그 항목은 [확인 필요]로 남아 판정의 쟁점이 된다.
 */
export interface FactQuestion {
  text: string;
  chips: Chip[];
}

export const FACT_QUESTIONS: Partial<Record<FactKey, FactQuestion>> = {
  impactPoint: {
    text: '차량 어느 부분에 충돌했나요?',
    chips: [
      { label: '앞범퍼', value: '앞범퍼' },
      { label: '우측 앞펜더', value: '우측 앞펜더' },
      { label: '우측 뒷문', value: '우측 뒷문' },
      { label: '뒷범퍼', value: '뒷범퍼' },
      { label: '잘 모르겠어요', value: '', isUnknown: true },
    ],
  },
  stopLineTiming: {
    text: '신호가 바뀔 때 정지선을 지나고 있었나요?',
    chips: [
      { label: '지나고 있었어요', value: '지나고 있었어요' },
      { label: '못 지났어요', value: '못 지났어요' },
      { label: '기억 안 나요', value: '', isUnknown: true },
    ],
  },
};
