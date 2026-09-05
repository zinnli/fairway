import type { Case, CaseSummary, VideoRef } from '@/domain/case';
import { emptyStages } from '@/domain/case';
import type { Rebuttal, Statement } from '@/domain/document';
import type { Verdict } from '@/domain/verdict';

/**
 * 시연 데이터 — 10_디자인.html의 h09·h10 사이드바에 그려진 두 사건이 정본이고,
 * 나머지는 같은 사고를 시간축 위 다른 지점에 세워 둔 것이다.
 * 9/3 축소로 "재판정중"이 없어져 상태는 6가지다
 * (접수중·분석중·확인 필요·판정 완료·발송 완료·종결).
 *
 * 문구는 지어내지 않고 시안(h09·h14·h16·h18·h21·h29·h30·h34)에서 가져왔다.
 * 다만 h18의 사실 표는 요약 글로 옮겼다 (04 문서 C7).
 * 인정기준 도표 번호는 미확정이라 chartNo는 전부 null이다.
 */

function seedCase(over: Partial<Case> & Pick<Case, 'id' | 'title' | 'status'>): Case {
  return {
    stages: emptyStages(),
    video: null,
    verdict: null,
    accidentAt: '2026-08-22T14:00:00+09:00',
    accidentPlace: '서울시 강남구 논현사거리',
    claimNo: null,
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

/**
 * 영상 분석 요약 — h18의 사실 표를 대신하는 글 한 덩이 (04 문서 C7).
 * 사고마다 볼 것이 달라 항목으로 못 박지 않는다. 못 본 것도 그대로 적는다.
 */
export const ANALYSIS_SUMMARY =
  '영상을 다 봤어요. 내 차는 2차로에서 직진 중이었고, 상대 차량은 우측에서 교차로에 ' +
  '들어왔어요. 진입할 때 상대 신호는 적색이었고, 내 차 속도는 약 48km/h로 보여요. ' +
  '충돌 부위와 정지선 통과 시점은 영상 각도 때문에 확인하지 못했어요.';

/**
 * 판정 전에 글로 되묻는 것 — h20b. 선택 칩 없이 글로 묻고 글로 받는다 (04 문서 C7).
 * 사고마다 물을 것이 달라 목에서는 시연 사례의 두 가지만 안다.
 *
 * 순번("1/2")은 **문장 끝에 붙여 보낸다** — 서버도 같은 자리에 넣는다(명세 §4).
 * 화면이 떼어 내 정보 글자로 돌리므로(AiText) 목과 서버가 똑같이 보인다.
 */
export const DEMO_QUESTIONS = [
  '차량 어느 부분에 충돌했는지 기억나세요? "우측 앞펜더"처럼 편하게 적어 주세요. 1/2',
  '신호가 바뀔 때 정지선을 지나고 있었나요? 기억이 안 나면 그렇게 적어 주셔도 괜찮아요. 2/2',
];

/** 판정 — 신호위반 일방과실 (h21). 일치도·쟁점·상대 주장은 9/3에 빠졌다 */
export const DEMO_VERDICT: Verdict = {
  ratio: { mine: 0, opponent: 100 },
  chartName: '신호기 있는 교차로 · 신호위반',
  chartNo: null,
  baseRatio: { mine: 0, opponent: 100 },
  adjustments: [],
  conclusion:
    '상대 신호위반 일방과실이에요. 내 차가 미리 알아차리거나 피할 수 없었던 것으로 판단돼요.',
  precedents: [
    { no: '2019-018856', summary: '신호위반 직진 충돌' },
    { no: '2021-004312', summary: '이륜차 교차로 진입', isReversed: true },
  ],
  createdAt: '2026-08-22T09:24:00+09:00',
};

/** 사건경위서 (h30 전문) */
export const DEMO_STATEMENT: Statement = {
  version: 1,
  sections: [
    {
      title: '사고 일시 및 장소',
      body: '2026년 8월 22일 14시경, 서울시 강남구 논현사거리 교차로에서 발생한 사고입니다.',
    },
    {
      title: '사고 경위',
      body:
        '본인은 2차로에서 정상 신호에 따라 직진 중이었습니다. 우측에서 적색 신호에 교차로에 ' +
        '진입한 이륜차가 본인 차량의 우측 앞펜더를 충격하였습니다.',
    },
    {
      title: '블랙박스 영상 분석 결과',
      body:
        '영상에서 본인 차량의 2차로 직진, 상대 차량의 적색 신호 진입, 주행 속도 약 48km/h가 ' +
        '확인됩니다.',
    },
    {
      title: '주장 요지',
      body:
        '상대 차량이 적색 신호에 교차로에 들어와 생긴 사고이므로, 상대 차량의 일방과실 적용을 ' +
        '요청드립니다.',
    },
  ],
  pageCount: 2,
  updatedAt: '2026-08-25T10:10:00+09:00',
};

/** 반박의견서 — 보낸 뒤 상태 (h34 본문·첨부) */
export const DEMO_REBUTTAL: Rebuttal = {
  to: 'claim@insu.co.kr',
  /** 시연에서는 채워 둔다 — 화면에서 지우고 다시 넣어 볼 수 있다 */
  claimNo: '2026-08-0000',
  subject: '과실비율 재검토 요청 (접수번호 2026-08-0000)',
  body:
    '블랙박스 영상에서 상대 차량의 적색 신호 진입이 확인됩니다. 인정기준 도표(신호기 있는 ' +
    '교차로 · 신호위반)와 심의사례 2019-018856 · 2021-004312에 비추어 나 0 : 상대 100이 ' +
    '타당합니다. 재검토를 요청드립니다.',
  attachments: [
    { id: 'att-statement', label: '사건경위서.pdf', included: true },
    { id: 'att-video', label: 'blackbox_0822.mp4', included: true },
  ],
  sentAt: '2026-08-28T16:40:00+09:00',
};

/**
 * 제출은 빈 목록으로 한다 (팀 결정). 심사위원은 [새 사건]부터 시작한다.
 * 아래 데이터는 지우지 않고 남겨 둔다 — 화면 확인과 MSW 테스트에 쓴다.
 * 필요하면 true로 켠다.
 */
const SEED = true;

/* ── 사건 6개 — 상태 하나당 하나 ─────────────────────────────────────────── */

const SEEDED: Case[] = [
  // 판정 완료 — h09·h21 정본. 목록 맨 위에 온다
  seedCase({
    id: 'case-0822',
    title: '교차로 직진 충돌 · 08-22',
    status: '판정 완료',
    stages: { analysis: '완료', verdict: '완료', statement: '대기', rebuttal: '대기' },
    video: DEMO_VIDEO,
    verdict: DEMO_VERDICT,
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

  // 분석중 — 영상은 올라갔고 아직 로딩 중 (h16)
  seedCase({
    id: 'case-0831',
    title: '교차로 직진 충돌 · 08-31',
    status: '분석중',
    stages: { analysis: '진행중', verdict: '대기', statement: '대기', rebuttal: '대기' },
    video: DEMO_VIDEO,
    createdAt: '2026-08-31T13:40:00+09:00',
    updatedAt: '2026-08-31T13:41:00+09:00',
  }),

  // 확인 필요 — 요약이 왔고 되묻는 중 (h20b)
  seedCase({
    id: 'case-0830',
    title: '교차로 직진 충돌 · 08-30',
    status: '확인 필요',
    stages: { analysis: '완료', verdict: '대기', statement: '대기', rebuttal: '대기' },
    video: DEMO_VIDEO,
    createdAt: '2026-08-30T10:05:00+09:00',
    updatedAt: '2026-08-30T10:12:00+09:00',
  }),

  // 발송 완료 — 경위서·반박의견서까지 보낸 뒤 (h34·f04)
  seedCase({
    id: 'case-0828',
    title: '교차로 직진 충돌 · 08-28',
    status: '발송 완료',
    stages: { analysis: '완료', verdict: '완료', statement: '완료', rebuttal: '완료' },
    video: DEMO_VIDEO,
    verdict: DEMO_VERDICT,
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
