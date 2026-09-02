import type { Case, CaseSummary, HistoryEntry, VideoRef } from '@/domain/case';
import { emptyStages } from '@/domain/case';
import type { Fact } from '@/domain/fact';
import type { Rebuttal, Statement } from '@/domain/document';
import type { Verdict } from '@/domain/verdict';

/**
 * 시연 데이터 — 10_디자인.html의 h09·h10 사이드바에 그려진 두 사건이 정본이고,
 * 나머지는 같은 사고를 시간축 위 다른 지점에 세워 둔 것이다.
 * 상태 7가지(접수중·분석중·확인 필요·판정 완료·재판정중·발송 완료·종결)가 한 벌씩 있어서
 * 사이드바만 열면 배지·현황판·대화 로그를 단계별로 다 볼 수 있다.
 *
 * 문구는 지어내지 않고 시안(h09·h14·h16·h18·h20·h21·h29·h30·h34)에서 그대로 가져왔다.
 * 인정기준 도표 번호는 미확정이라 chartNo는 전부 null이다.
 *
 * 지금은 메모리에만 산다. Dexie 영속화는 MSW를 붙일 때 이어 붙인다.
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
    accidentAt: '2026-08-22T14:00:00+09:00',
    accidentPlace: '서울시 강남구 논현사거리',
    claimNo: null,
    history: [],
    createdAt: '2026-08-22T09:00:00+09:00',
    updatedAt: '2026-08-22T09:00:00+09:00',
    ...over,
  };
}

/* ── 사건에 붙는 조각들. 대화 로그(demoLog.ts)도 이 값을 그대로 쓴다 ───────── */

export const DEMO_VIDEO: VideoRef = {
  id: 'video-0822',
  name: 'blackbox_0822.mp4',
  sizeBytes: 18 * 1024 * 1024, // 18MB
  durationSec: 42,
};

/** 분석이 막 시작됐을 때 — 영상에서 두 가지만 나온 상태 (h16) */
export const FACTS_ANALYZING: Fact[] = [
  { key: 'myLane', value: '2차로 직진', source: 'video', confidence: 0.96 },
  { key: 'opponentEntry', value: '상대 우측 진입', source: 'video', confidence: 0.94 },
];

/** 사실 카드가 도착한 직후 — 영상에서 4개, 두 개는 확인 필요 (h18·h20) */
export const FACTS_PENDING: Fact[] = [
  ...FACTS_ANALYZING,
  { key: 'opponentSignal', value: '상대 적색 신호 (위반)', source: 'video', confidence: 0.91 },
  { key: 'mySpeed', value: '약 48km/h', source: 'video', confidence: 0.88 },
  { key: 'impactPoint', value: '충돌 부위 확인 필요', source: 'unknown', note: '영상 각도로는 안 보여요' },
  {
    key: 'stopLineTiming',
    value: '정지선 통과 확인 필요',
    source: 'unknown',
    note: '정지선이 화면 밖이에요',
  },
];

/** 질문에 답한 뒤 — 충돌 부위는 내가 말했고, 정지선만 쟁점으로 남았다 (h09·h21) */
export const FACTS_CONFIRMED: Fact[] = FACTS_PENDING.map((f) =>
  f.key === 'impactPoint'
    ? { key: 'impactPoint', value: '우측 앞펜더', source: 'statement' }
    : f.key === 'stopLineTiming'
      ? { ...f, isDisputed: true }
      : f,
);

/** 상대 신호를 황색으로 고친 뒤 (h28·h29) */
export const FACTS_AMBER: Fact[] = FACTS_CONFIRMED.map((f) =>
  f.key === 'opponentSignal'
    ? { key: 'opponentSignal', value: '상대 황색 신호', source: 'statement' }
    : f,
);

/** 첫 판정 — 신호위반 일방과실 (h21). 도표 번호는 미확정이라 null */
export const VERDICT_RED: Verdict = {
  ratio: { mine: 0, opponent: 100 },
  chartName: '신호기 있는 교차로 · 신호위반',
  chartNo: null,
  baseRatio: { mine: 0, opponent: 100 },
  adjustments: [],
  conclusion:
    '상대 신호위반 일방과실이에요. 내 차가 미리 알아차리거나 피할 수 없었던 것으로 판단돼요.',
  precedents: [
    { no: '2019-018856', summary: '신호위반 직진 충돌', match: 0.95 },
    { no: '2021-004312', summary: '이륜차 교차로 진입', match: 0.88, isReversed: true },
  ],
  disputes: ['정지선 통과 시점 확인 필요'],
  opponentClaim: { mine: 30, opponent: 70 },
  createdAt: '2026-08-22T09:24:00+09:00',
};

/** 재판정 결과 — 황색 신호 진입이라 가감 사정이 붙는다 (h31) */
export const VERDICT_AMBER: Verdict = {
  ratio: { mine: 20, opponent: 80 },
  chartName: '신호기 있는 교차로 · 황색 신호 진입',
  chartNo: null,
  baseRatio: { mine: 20, opponent: 80 },
  adjustments: [{ label: '황색 신호 진입', delta: 20 }],
  conclusion:
    '상대 신호가 황색으로 바뀌어, 신호위반 일방과실 대신 기본 과실에 가감 사정이 적용됐어요.',
  precedents: [],
  disputes: ['정지선 통과 시점 확인 필요'],
  opponentClaim: { mine: 30, opponent: 70 },
  createdAt: '2026-08-30T11:05:00+09:00',
};

/** 사건경위서 첫 번째 버전 (h30 전문) */
export const DEMO_STATEMENT: Statement = {
  version: 1,
  sections: [
    {
      title: '사고 일시 및 장소',
      body: '2026년 8월 22일 14시경, 서울시 강남구 논현사거리 교차로에서 발생한 사고입니다.',
      sources: [
        { label: '영상(찍힌 시각)', source: 'video' },
        { label: '내가 말한 것(사고 장소)', source: 'statement' },
      ],
    },
    {
      title: '사고 경위',
      body:
        '본인은 2차로에서 정상 신호에 따라 직진 중이었습니다. 우측에서 적색 신호에 교차로에 ' +
        '진입한 이륜차가 본인 차량의 우측 앞펜더를 충격하였습니다.',
      sources: [
        { label: '영상(차선·신호)', source: 'video' },
        { label: '내가 말한 것(충돌 부위)', source: 'statement' },
      ],
    },
    {
      title: '블랙박스 영상 분석 결과',
      body:
        '영상에서 본인 차량의 2차로 직진, 상대 차량의 적색 신호 진입, 주행 속도 약 48km/h가 ' +
        '확인됩니다.',
      sources: [
        { label: '영상(차선·신호·속도)', source: 'video' },
        { label: '정지선 통과 시점은 확인 필요', source: 'unknown' },
      ],
    },
    {
      title: '주장 요지',
      body:
        '상대 차량이 적색 신호에 교차로에 들어와 생긴 사고이므로, 상대 차량의 일방과실 적용을 ' +
        '요청드립니다.',
      sources: [
        {
          label:
            '인정기준 도표(신호기 있는 교차로 · 신호위반) · 심의사례 2019-018856 · 2021-004312',
          source: 'ref',
        },
      ],
    },
  ],
  pageCount: 2,
  reflectedMessageCount: 12,
  updatedAt: '2026-08-25T10:10:00+09:00',
};

/** 반박의견서 — 보낸 뒤 상태 (h34 본문·첨부) */
export const DEMO_REBUTTAL: Rebuttal = {
  to: 'claim@insu.co.kr',
  subject: '과실비율 재검토 요청 (접수번호 2026-08-0000)',
  body:
    '귀사는 나 30 : 상대 70을 제시하셨습니다. 블랙박스 영상에서 상대 차량의 적색 신호 진입이 ' +
    '확인됩니다. 인정기준 도표(신호기 있는 교차로 · 신호위반)와 심의사례 2019-018856 · ' +
    '2021-004312에 비추어 나 0 : 상대 100이 타당합니다.',
  attachments: [
    { id: 'att-statement', label: '사건경위서.pdf', included: true },
    { id: 'att-video', label: 'blackbox_0822.mp4', included: true },
  ],
  sentAt: '2026-08-28T16:40:00+09:00',
};

const AMBER_HISTORY: HistoryEntry[] = [
  {
    id: 'h-amber',
    at: '2026-08-30T11:02:00+09:00',
    kind: 'fact',
    text: '상대 신호: 적색 (위반) → 황색 (내가 말한 것)',
  },
];

/**
 * ★ 임시 — 화면 확인 동안 빈 목록(h08·온보딩)을 보려고 끌 수 있게 뒀다.
 *   시연 때는 true. 데이터는 아래에 그대로 남아 있다.
 */
const SEED = true;

/* ── 사건 7개 — 상태 하나당 하나 ─────────────────────────────────────────── */

const SEEDED: Case[] = [
  // 판정 완료 — h09·h21 정본. 목록 맨 위에 온다
  seedCase({
    id: 'case-0822',
    title: '교차로 직진 충돌 · 08-22',
    status: '판정 완료',
    stages: { analysis: '완료', verdict: '완료', statement: '대기', rebuttal: '대기' },
    facts: FACTS_CONFIRMED,
    video: DEMO_VIDEO,
    verdict: VERDICT_RED,
    updatedAt: '2026-09-02T09:24:00+09:00',
  }),

  // 접수중 — 아직 이름도 영상도 없는 새 사건 (h12·h14)
  seedCase({
    id: 'case-0901',
    title: null,
    status: '접수중',
    accidentAt: null,
    accidentPlace: null,
    createdAt: '2026-09-01T18:20:00+09:00',
    updatedAt: '2026-09-01T18:20:00+09:00',
  }),

  // 분석중 — 영상은 올라갔고 사실이 두 개까지 나온 상태 (h16)
  seedCase({
    id: 'case-0831',
    title: '교차로 직진 충돌 · 08-31',
    status: '분석중',
    stages: { analysis: '진행중', verdict: '대기', statement: '대기', rebuttal: '대기' },
    facts: FACTS_ANALYZING,
    video: DEMO_VIDEO,
    createdAt: '2026-08-31T13:40:00+09:00',
    updatedAt: '2026-08-31T13:41:00+09:00',
  }),

  // 확인 필요 — 사실 카드가 왔고 두 가지를 되묻는 중 (h18·h20)
  seedCase({
    id: 'case-0830',
    title: '교차로 직진 충돌 · 08-30',
    status: '확인 필요',
    stages: { analysis: '진행중', verdict: '대기', statement: '대기', rebuttal: '대기' },
    facts: FACTS_PENDING,
    video: DEMO_VIDEO,
    createdAt: '2026-08-30T10:05:00+09:00',
    updatedAt: '2026-08-30T10:12:00+09:00',
  }),

  // 재판정중 — 상대 신호를 고쳐서 다시 따지는 중 (h28·h29)
  seedCase({
    id: 'case-0829',
    title: '교차로 직진 충돌 · 08-29',
    status: '재판정중',
    stages: { analysis: '완료', verdict: '진행중', statement: '대기', rebuttal: '대기' },
    facts: FACTS_AMBER,
    video: DEMO_VIDEO,
    verdict: VERDICT_RED,
    history: AMBER_HISTORY,
    createdAt: '2026-08-29T09:00:00+09:00',
    updatedAt: '2026-08-29T11:02:00+09:00',
  }),

  // 발송 완료 — 경위서·반박의견서까지 보낸 뒤 (h34·f04)
  seedCase({
    id: 'case-0828',
    title: '교차로 직진 충돌 · 08-28',
    status: '발송 완료',
    stages: { analysis: '완료', verdict: '완료', statement: '완료', rebuttal: '완료' },
    facts: FACTS_CONFIRMED,
    video: DEMO_VIDEO,
    verdict: VERDICT_RED,
    claimNo: '2026-08-0000',
    createdAt: '2026-08-28T09:00:00+09:00',
    updatedAt: '2026-08-28T16:40:00+09:00',
  }),

  // 종결 — h10 정본. 다른 사고라 영상·판정은 붙이지 않는다
  seedCase({
    id: 'case-0714',
    title: '주차장 후진 접촉 · 07-14',
    status: '종결',
    stages: { analysis: '완료', verdict: '완료', statement: '완료', rebuttal: '완료' },
    accidentAt: '2026-07-14T19:30:00+09:00',
    accidentPlace: null,
    createdAt: '2026-07-14T09:00:00+09:00',
    updatedAt: '2026-07-14T09:00:00+09:00',
  }),
];

export const DEMO_CASES: Case[] = SEED ? SEEDED : [];

export const toSummary = (c: Case): CaseSummary => ({
  id: c.id,
  title: c.title,
  status: c.status,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});
