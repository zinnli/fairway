import type { ChatMessage, MessageBody } from '@/domain/message';
import {
  DEMO_REBUTTAL,
  DEMO_STATEMENT,
  DEMO_VIDEO,
  FACTS_PENDING,
  VERDICT_RED,
} from './demo';

/**
 * 사건별 지난 대화 — 사건을 열면 이 로그가 되살아난다.
 * 화면 h12~h39는 다른 화면이 아니라 이 로그가 어디까지 쌓였느냐다.
 * 그래서 단계별 시연 사건은 같은 앞부분을 쓰고 뒤만 다르다.
 *
 * 문구는 시안(h13·h14·h16·h18·h20·h21·h29)에서 그대로 가져왔다.
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

/** 사실 카드 → 질문 → 내 대답 (h18·h20) */
const AFTER_FACTS: Body[] = [
  { role: 'ai', kind: 'facts', facts: FACTS_PENDING },
  {
    role: 'ai',
    kind: 'question',
    field: 'impactPoint',
    text: '확인 고마워요. 판정까지 두 가지만 더 물어볼게요. 차량 어느 부분에 충돌했나요?',
    chips: [
      { label: '앞범퍼', value: '앞범퍼' },
      { label: '우측 앞펜더', value: '우측 앞펜더' },
      { label: '우측 뒷문', value: '우측 뒷문' },
      { label: '뒷범퍼', value: '뒷범퍼' },
      { label: '잘 모르겠어요', value: '', isUnknown: true },
    ],
  },
  { role: 'user', kind: 'choice', label: '우측 앞펜더', forField: 'impactPoint' },
];

const VERDICT_STEP: Body[] = [{ role: 'ai', kind: 'verdict', verdict: VERDICT_RED }];

export const DEMO_LOGS: Record<string, ChatMessage[]> = {
  // 접수중 — 아직 영상이 없다 (h13)
  'case-0901': log('case-0901', '2026-09-01T18:22:00+09:00', OPENING.slice(0, 3)),

  // 분석중 — 진행 중인 카드는 하나뿐이고 그 자리에서 단계만 바뀐다 (h16)
  'case-0831': log('case-0831', '2026-08-31T13:41:00+09:00', [
    ...OPENING,
    { role: 'ai', kind: 'analyzing', step: '신호등을 확인하고 있어요…' },
  ]),

  // 확인 필요 — 질문을 던져 두고 답을 기다리는 중 (h20)
  'case-0830': log('case-0830', '2026-08-30T10:12:00+09:00', [
    ...OPENING,
    ...AFTER_FACTS.slice(0, 2),
  ]),

  // 판정 완료 — h09·h21 정본
  'case-0822': log('case-0822', '2026-09-02T09:24:00+09:00', [
    ...OPENING,
    ...AFTER_FACTS,
    ...VERDICT_STEP,
  ]),

  // 재판정중 — 상대 신호를 고쳐서 다시 따지는 중 (h28·h29)
  'case-0829': log('case-0829', '2026-08-29T11:02:00+09:00', [
    ...OPENING,
    ...AFTER_FACTS,
    ...VERDICT_STEP,
    { role: 'user', kind: 'choice', label: '상대 신호를 "황색"으로 고쳤어요', forField: 'opponentSignal' },
    {
      role: 'ai',
      kind: 'rejudging',
      from: VERDICT_RED.ratio,
      reason: '판정에 쓰인 정보라서 과실비율을 다시 따지고 있어요…',
    },
  ]),

  // 발송 완료 — 경위서·반박의견서까지 (h30·h34·f04)
  'case-0828': log('case-0828', '2026-08-28T16:40:00+09:00', [
    ...OPENING,
    ...AFTER_FACTS,
    ...VERDICT_STEP,
    { role: 'ai', kind: 'statementDraft', doc: DEMO_STATEMENT },
    { role: 'ai', kind: 'rebuttalDraft', doc: DEMO_REBUTTAL },
    { role: 'ai', kind: 'sent', to: DEMO_REBUTTAL.to },
    { role: 'ai', kind: 'nextSteps' },
  ]),

  // 종결 — 다른 사고라 시연 문구를 지어내지 않고 짧게 둔다 (h10)
  'case-0714': log('case-0714', '2026-07-14T09:10:00+09:00', [
    { role: 'ai', kind: 'guide' },
    { role: 'user', kind: 'text', text: '주차장에서 후진하다가 옆 차와 부딪혔어요.' },
    { role: 'ai', kind: 'nextSteps' },
  ]),
};
