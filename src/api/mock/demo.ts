import type { Case, CaseSummary } from '@/domain/case';
import { emptyStages } from '@/domain/case';

/**
 * 시연 데이터 — 10_디자인.html의 h09·h10 사이드바에 그려진 두 사건.
 * 지금은 메모리에만 산다. Dexie 영속화는 작업 화면을 만들 때 붙인다.
 *
 * 심사위원이 주소만 열면 바로 쓸 수 있어야 하므로(기능명세 6.3 · P0)
 * 로그인 없이도 이 목록이 보여야 한다.
 */

function seedCase(over: Partial<Case> & Pick<Case, 'id' | 'title' | 'status'>): Case {
  return {
    stages: emptyStages(),
    facts: [],
    video: null,
    verdict: null,
    previousRatio: null,
    accidentAt: null,
    accidentPlace: null,
    claimNo: null,
    history: [],
    createdAt: '2026-08-22T09:00:00+09:00',
    updatedAt: '2026-08-22T09:00:00+09:00',
    ...over,
  };
}

export const DEMO_CASES: Case[] = [
  seedCase({
    id: 'case-0822',
    title: '교차로 직진 충돌 · 08-22',
    status: '판정 완료',
    stages: { analysis: '완료', verdict: '완료', statement: '대기', rebuttal: '대기' },
    accidentAt: '2026-08-22T14:00:00+09:00',
    accidentPlace: '서울시 강남구 논현사거리',
  }),
  seedCase({
    id: 'case-0714',
    title: '주차장 후진 접촉 · 07-14',
    status: '종결',
    stages: { analysis: '완료', verdict: '완료', statement: '완료', rebuttal: '완료' },
    createdAt: '2026-07-14T09:00:00+09:00',
    updatedAt: '2026-07-14T09:00:00+09:00',
  }),
];

export const toSummary = (c: Case): CaseSummary => ({
  id: c.id,
  title: c.title,
  status: c.status,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});
