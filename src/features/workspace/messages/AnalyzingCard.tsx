import { Dots } from '@/components/ui/Dots';
import { AiMessage, AiNote } from './AiMessage';

/**
 * 기다리는 중 — h16. 9/3 축소로 단계 시각화와 [분석 멈추기]가 빠졌다 (04 문서 C6).
 * 남은 것은 로딩 표시 하나뿐이다. 일이 끝나면 이 카드는 치우고 서버가 만든 진짜 카드가
 * 그 자리를 받는다 — 끝난 모양을 따로 그리지 않는다.
 *
 * 분석·판정만 쓰던 것을 서류 만들기·다시 쓰기까지 넓혔다 — 그쪽은 단추 글자만
 * 바뀌어서 대화를 보고 있으면 무슨 일이 도는지 알 수 없었다.
 */
export function AnalyzingCard({
  phase = 'analysis',
}: {
  /** 무엇을 기다리는 중인가. 단계가 아니라 작업 하나를 가리킨다 */
  phase?: 'analysis' | 'verdict' | 'reply' | 'report' | 'rebuttal';
}) {
  /* 걸리는 시간을 아는 것은 분석·판정뿐이다 — 나머지는 없는 숫자를 지어내지 않고 줄을 뺀다 */
  const { label, note } =
    phase === 'verdict'
      ? { label: '과실비율을 계산하고 있어요', note: '보통 20~30초 걸려요. 끝나면 알려 드릴게요.' }
      : phase === 'reply'
        ? { label: '답변을 쓰고 있어요', note: null }
        : phase === 'report'
          ? { label: '사건경위서를 쓰고 있어요', note: null }
          : phase === 'rebuttal'
            ? { label: '반박의견서를 쓰고 있어요', note: null }
            : { label: '영상을 분석하고 있어요', note: '보통 1~2분 걸려요. 끝나면 알려 드릴게요.' };

  return (
    <AiMessage className="gap-2">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        {label}
        <Dots className="text-brand" />
      </p>
      {note && <AiNote>{note}</AiNote>}
    </AiMessage>
  );
}
