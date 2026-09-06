import type { ChatMessage, MessageBody } from '@/domain/message';
import {
  ANALYSIS_SUMMARY,
  DEMO_QUESTIONS,
  DEMO_REBUTTAL,
  DEMO_STATEMENT,
  DEMO_VERDICT,
  DEMO_VIDEO,
} from './demo';

/**
 * 사건별 지난 대화 — 사건을 열면 이 로그가 되살아난다.
 * 화면 h12~h37은 다른 화면이 아니라 이 로그가 어디까지 쌓였느냐다.
 * 그래서 단계별 시연 사건은 같은 앞부분을 쓰고 뒤만 다르다.
 *
 * 9/3 축소로 사실 카드·칩 질문·재판정이 빠졌다. 분석 결과도 되물음도 전부 글이다.
 */

type Body = MessageBody;

function log(caseId: string, at: string, bodies: Body[]): ChatMessage[] {
  return bodies.map((body, i) => ({ ...body, id: `${caseId}-${i + 1}`, at }) as ChatMessage);
}

/** 영상을 올린 사건은 여기까지가 똑같다 (h13·h14) */
const OPENING: Body[] = [
  { role: 'ai', kind: 'guide' },
  {
    role: 'user',
    kind: 'text',
    text: '어제 교차로에서 직진하는데 옆에서 오토바이가 박았어요. 과실비율 어느 정도 나올까요?',
  },
  {
    role: 'ai',
    kind: 'text',
    text:
      '많이 놀라셨겠어요. 지금 설명만으로는 정확한 비율을 말씀드리기 어려워요 — ' +
      '블랙박스 영상을 올려 주시면 1~2분 안에 예상 과실비율을 근거와 함께 보여 드릴게요.',
  },
  { role: 'user', kind: 'video', video: DEMO_VIDEO },
];

/** 분석 요약 → 되물음 → 내 대답 (h18 대체 · h20b) */
const AFTER_ANALYSIS: Body[] = [
  { role: 'ai', kind: 'text', text: ANALYSIS_SUMMARY },
  { role: 'ai', kind: 'text', text: DEMO_QUESTIONS[0] },
  { role: 'user', kind: 'text', text: '우측 앞펜더요.' },
  { role: 'ai', kind: 'text', text: DEMO_QUESTIONS[1] },
  { role: 'user', kind: 'text', text: '기억이 잘 안 나요.' },
];

const VERDICT_STEP: Body[] = [{ role: 'ai', kind: 'verdict', verdict: DEMO_VERDICT }];

/**
 * 대화가 길 때의 화면을 보려고 만든 긴 로그 — **개발 서버에서만 붙는다** (demo.ts).
 *
 * 목의 `listMessages`는 서버처럼 한 쪽(30장)씩 준다. 그래서 이 사건을 열면
 * 맨 아래 한 쪽만 먼저 오고, 위로 올리면 앞쪽이 이어 붙는다 (명세 C-1).
 * 건수는 어디에도 세지 않는다 (04 문서 C9).
 */
const CHITCHAT: [string, string][] = [
  ['사고 접수는 언제까지 하면 되나요?', '보험사마다 다르지만 사고 뒤 되도록 빨리 접수하는 편이 좋아요. 접수번호를 받으면 알려 주세요.'],
  ['상대가 신호를 지켰다고 우겨요.', '영상에 신호 상태가 담겨 있으면 그 주장은 힘을 잃어요. 판정에서 그 부분을 근거로 짚어 드릴게요.'],
  ['보험사에서 3 대 7이라고 하던데요.', '상대 보험사가 제시한 비율을 알려 주시면 판정과 나란히 놓고 견주어 드릴게요.'],
  ['수리비는 누가 내나요?', '과실비율에 따라 나눠 부담해요. 비율이 바뀌면 부담도 함께 바뀝니다.'],
  ['병원에 다녀왔는데 이것도 영향이 있나요?', '치료 기록은 인적 피해를 다툴 때 쓰여요. 과실비율 자체는 사고 경위로 정해집니다.'],
  ['블랙박스 화질이 안 좋아도 되나요?', '번호판까지 또렷하지 않아도 신호와 진행 방향이 보이면 분석에 씁니다.'],
  ['상대 차가 과속한 것 같아요.', '영상 속 이동 거리와 시간으로 대략의 속도를 봅니다. 확실하지 않으면 쟁점으로 남겨 둬요.'],
  ['경찰 조사도 받아야 하나요?', '인적 피해가 있으면 조사가 따라올 수 있어요. 이 서비스는 과실비율만 다룹니다.'],
  ['합의를 먼저 하자고 연락이 왔어요.', '비율을 확인하기 전에 서둘러 합의하면 되돌리기 어려워요. 판정을 보고 정하셔도 늦지 않습니다.'],
  ['분쟁심의위원회는 어떻게 가나요?', '내 보험사에 심의 청구를 요청하는 방법으로 갑니다. 발송 뒤 안내해 드릴게요.'],
];

/** 시각을 한 걸음씩 밀어 준다 — 같은 시각이 줄줄이 찍히면 대화로 안 보인다 */
function longLog(caseId: string, startAt: string, bodies: Body[]): ChatMessage[] {
  const t0 = new Date(startAt).getTime();
  return bodies.map(
    (body, i) =>
      ({
        ...body,
        id: `${caseId}-${i + 1}`,
        at: new Date(t0 + i * 60_000).toISOString(),
      }) as ChatMessage,
  );
}

/* 함수로 둔다 — 개발 서버가 아니면 부르는 곳이 없어 빌드에서 통째로 빠진다 */
const longBodies = (): Body[] => [
  ...OPENING,
  ...AFTER_ANALYSIS,
  /* 같은 이야기가 도는 것이 아니라 서로 다른 문답이 이어지도록 세 바퀴 돌린다 */
  ...Array.from({ length: 3 }, (_, round) =>
    CHITCHAT.map(([mine, reply]): Body[] => [
      { role: 'user', kind: 'text', text: round === 0 ? mine : `${mine} (${round + 1}번째로 여쭤요)` },
      { role: 'ai', kind: 'text', text: reply },
    ]).flat(),
  ).flat(),
  ...VERDICT_STEP,
  { role: 'ai', kind: 'statementDraft', doc: DEMO_STATEMENT },
];

export const DEMO_LOGS: Record<string, ChatMessage[]> = {
  // 접수중 — 아직 영상이 없다 (h13)
  'case-0901': log('case-0901', '2026-09-01T18:22:00+09:00', OPENING.slice(0, 3)),

  // 분석중 — 로딩 카드 하나뿐이다 (h16)
  'case-0831': log('case-0831', '2026-08-31T13:41:00+09:00', [
    ...OPENING,
    { role: 'ai', kind: 'analyzing' },
  ]),

  // 확인 필요 — 요약을 주고 첫 질문의 답을 기다리는 중 (h20b)
  'case-0830': log('case-0830', '2026-08-30T10:12:00+09:00', [
    ...OPENING,
    ...AFTER_ANALYSIS.slice(0, 2),
  ]),

  // 판정 완료 — h09·h21 정본
  'case-0822': log('case-0822', '2026-09-02T09:24:00+09:00', [
    ...OPENING,
    ...AFTER_ANALYSIS,
    ...VERDICT_STEP,
  ]),

  // 발송 완료 — 경위서·반박의견서까지 (h30·h34·f04)
  'case-0828': log('case-0828', '2026-08-28T16:40:00+09:00', [
    ...OPENING,
    ...AFTER_ANALYSIS,
    ...VERDICT_STEP,
    { role: 'ai', kind: 'statementDraft', doc: DEMO_STATEMENT },
    { role: 'ai', kind: 'rebuttalDraft', doc: DEMO_REBUTTAL },
    {
      role: 'ai',
      kind: 'sent',
      to: DEMO_REBUTTAL.to,
      attachmentCount: DEMO_REBUTTAL.attachments.filter((a) => a.included).length,
    },
    { role: 'ai', kind: 'nextSteps' },
  ]),

  /* 대화가 긴 사건 — 페이지네이션 확인용. 사건 자체가 개발 서버에서만 뜨므로(demo.ts)
     로그도 같이 접어 둔다. 빌드에서는 통째로 떨어져 나간다 */
  ...(import.meta.env.DEV
    ? { 'case-long': longLog('case-long', '2026-09-05T09:00:00+09:00', longBodies()) }
    : {}),

  // 종결 — 다른 사고라 시연 문구를 지어내지 않고 짧게 둔다 (h10)
  'case-0714': log('case-0714', '2026-07-14T09:10:00+09:00', [
    { role: 'ai', kind: 'guide' },
    { role: 'user', kind: 'text', text: '주차장에서 후진하다가 옆 차와 부딪혔어요.' },
    { role: 'ai', kind: 'nextSteps' },
  ]),
};
