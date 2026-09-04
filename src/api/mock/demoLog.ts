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
