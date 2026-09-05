import { Dots } from '@/components/ui/Dots';
import { AiMessage, AiNote } from './AiMessage';

/**
 * 분석 중 — h16. 9/3 축소로 단계 시각화와 [분석 멈추기]가 빠졌다 (04 문서 C6).
 * 남은 것은 로딩 표시 하나뿐이다. 카드를 새로 쌓지 않고 이 자리에서 끝난 모양으로 바뀐다.
 */
export function AnalyzingCard({
  phase = 'analysis',
  done,
}: {
  /** 무엇을 기다리는 중인가. 단계가 아니라 작업 하나를 가리킨다 */
  phase?: 'analysis' | 'verdict';
  done?: boolean;
}) {
  const judging = phase === 'verdict';
  return (
    <AiMessage className="gap-2">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        {done
          ? '영상을 다 봤어요'
          : judging
            ? '과실비율을 계산하고 있어요'
            : '영상을 분석하고 있어요'}
        {!done && <Dots className="text-brand" label="분석 중" />}
      </p>
      {!done && (
        <AiNote>
          {judging ? '보통 20~30초 걸려요.' : '보통 1~2분 걸려요.'} 끝나면 알려 드릴게요.
        </AiNote>
      )}
    </AiMessage>
  );
}
