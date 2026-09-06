import type { Case, CaseSummary, Facts, VideoRef } from '@/domain/case';
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

/**
 * 확인된 사실 — 시안 h21·h23의 칩 묶음. 서버가 영상 분석에서 뽑아 준다.
 * 마지막 하나가 `pending`이라 "남은 1개는 쟁점이에요"가 된다.
 * 제목 문장은 서버가 만들어 보내므로 목도 통째로 들고 있는다.
 */
export const DEMO_FACTS: Facts = {
  confirmed: 5,
  total: 6,
  label: '확인된 사실 5 / 6 · 남은 1개는 쟁점이에요',
  items: [
    { label: '2차로 직진', source: 'video' },
    { label: '상대 우측 진입', source: 'video' },
    { label: '상대 적색 신호 (위반)', source: 'video' },
    { label: '약 48km/h', source: 'video' },
    { label: '우측 앞펜더', source: 'video' },
    { label: '정지선 통과 확인 필요', source: 'pending' },
  ],
};

function seedCase(over: Partial<Case> & Pick<Case, 'id' | 'title' | 'status'>): Case {
  return {
    stages: emptyStages(),
    video: null,
    verdict: null,
    accidentAt: '2026-08-22T14:00:00+09:00',
    accidentPlace: '서울시 강남구 논현사거리',
    claimNo: null,
    /* 영상 분석 전에는 null이다 — 분석이 끝난 사건만 아래에서 채운다 */
    facts: null,
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
export const ANALYSIS_SUMMARY = [
  /* 서버가 **문장마다 줄을 나눠** 보낸다. 목도 같은 모양이어야 화면이 같아진다
     (AiText의 whitespace-pre-line이 이 줄바꿈을 살린다) */
  '영상을 다 봤어요.',
  '내 차는 2차로에서 직진 중이었고, 상대 차량은 우측에서 교차로에 들어왔어요.',
  '진입할 때 상대 신호는 적색이었고, 내 차 속도는 약 48km/h로 보여요.',
  '충돌 부위와 정지선 통과 시점은 영상 각도 때문에 확인하지 못했어요.',
].join('\n');

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

/** 판정 — 신호위반 일방과실 (h21). 일치도·쟁점은 9/3에 뺀 채다 (상대 주장 비교만 9/6에 돌아왔다) */
export const DEMO_VERDICT: Verdict = {
  ratio: { mine: 0, opponent: 100 },
  /* 시안 h23이 그려 둔 값. null로 두면 비교 막대가 사라지는 쪽을 볼 수 있다 */
  opponentClaim: { mine: 30, opponent: 70 },
  opponentClaimNote: '상대 보험사 주장보다 내 과실이 30%p 낮게 나왔어요',
  /*
    서버는 번호를 이름 앞에 붙여 보낸다 — "266 · 차대차 회전교차로 사고" (9/6).
    **목은 번호를 모른다.** 이 시연 사례(신호위반 교차로)에 붙을 번호를 아무도 정해 주지
    않았으므로 지어내지 않고 이름만 둔다 — 시안 h21도 번호 없이 그려 뒀다.
  */
  chartName: '신호기 있는 교차로 · 신호위반',
  chartNote: '사고 유형별 기본 비율을 정해 둔 표 · 차대이륜차 편',
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

/**
 * 심의사례 그림 **자리표시자** — 목에서만 쓴다.
 *
 * 진짜 그림은 서버가 서명 붙은 주소로 준다(`imageUrl`). 목에는 그 파일이 없어서
 * 그림 자리가 통째로 안 그려지고, 그러면 팝업 배치를 눈으로 확인할 수 없다.
 * 그래서 **실제와 같은 비율(830×420)** 의 SVG를 data URI로 심어 둔다 —
 * 파일도 네트워크도 필요 없고, 서버에 붙으면 이 값은 쓰이지 않는다.
 *
 * 진짜 자료로 오해하지 않도록 그림 안에 목 데이터라고 적어 둔다.
 */
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="830" height="420" viewBox="0 0 830 420">
  <rect width="830" height="420" fill="#FAFBFC"/>
  <rect x="24" y="24" width="782" height="48" fill="#F0F2F5"/>
  <text x="415" y="54" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#667085">사례 개요</text>
  <g stroke="#E4E7EC" stroke-width="1">
    <rect x="24" y="72" width="782" height="56" fill="none"/>
    <rect x="24" y="128" width="782" height="56" fill="none"/>
    <rect x="24" y="184" width="782" height="56" fill="none"/>
    <rect x="24" y="240" width="782" height="56" fill="none"/>
    <line x1="220" y1="72" x2="220" y2="296"/>
  </g>
  <text x="415" y="356" text-anchor="middle" font-family="sans-serif" font-size="17" fill="#98A2B3">그림 자리 · 목 데이터</text>
  <text x="415" y="384" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#98A2B3">서버에 붙으면 실제 사례 개요 표가 들어옵니다</text>
</svg>`;

export const DEMO_PRECEDENT_IMAGE = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`;

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
  /* 위 네 절이 11pt·여백 18/16mm에서 한 장에 들어간다.
     명세 예시가 2로 적혀 있지만 그건 같은 본문에 붙은 자리표시자 값이다 */
  pageCount: 1,
  dateLabel: '08-25',
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
    facts: DEMO_FACTS,
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
    facts: DEMO_FACTS,
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
    facts: DEMO_FACTS,
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

/**
 * 대화가 긴 사건 — **개발 서버에서만 붙는다** (`pnpm dev`).
 * 대화가 길게 쌓였을 때의 화면과 한 쪽씩 읽어 오는 흐름(명세 C-1)을 확인하려고 둔다.
 * 빌드에는 들어가지 않으므로 심사용 배포에는 보이지 않는다.
 */
const LONG_CHAT: Case[] = import.meta.env.DEV
  ? [
      seedCase({
        id: 'case-long',
        title: '대화가 긴 사건 · 개발용',
        status: '판정 완료',
        stages: { analysis: '완료', verdict: '완료', statement: '완료', rebuttal: '대기' },
        video: DEMO_VIDEO,
        verdict: DEMO_VERDICT,
        facts: DEMO_FACTS,
        createdAt: '2026-09-05T09:00:00+09:00',
        updatedAt: '2026-09-05T10:10:00+09:00',
      }),
    ]
  : [];

export const DEMO_CASES: Case[] = [...(SEED ? SEEDED : []), ...LONG_CHAT];

export const toSummary = (c: Case): CaseSummary => ({
  id: c.id,
  title: c.title,
  status: c.status,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});
