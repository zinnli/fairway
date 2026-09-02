import { formatRatio, type Ratio } from '@/domain/verdict';
import { AiMessage, AiNote, AiText } from './AiMessage';

/**
 * 재판정 중 — h24. 판정에 쓰인 사실이 바뀌면 버튼 없이 다시 따진다.
 * 이전 판정은 지우지 않고 그대로 두고 옆에 새 값을 놓는다.
 */
const STEPS = [
  '바뀐 사실을 반영했어요',
  '인정기준 도표(사고 유형별 기본 비율 표)를 다시 찾고 있어요…',
  '비슷한 심의사례를 다시 맞춰요',
];

export function RejudgingCard({ from, reason }: { from: Ratio; reason: string }) {
  return (
    <AiMessage className="gap-3">
      <p className="text-[15px] font-semibold text-ink">과실비율을 다시 판정하고 있어요</p>
      <AiText>{reason}</AiText>

      <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
        <span className="text-muted">이전 판정</span>
        <span className="tnum text-ink">{formatRatio(from)}</span>
      </div>

      <ul className="flex flex-col gap-2 text-[14px] leading-[1.5]">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            {/* 8px 점 — 부품 규격이라 4배수 예외 */}
            <span
              className={`mx-1 h-2 w-2 shrink-0 rounded-full ${i === 1 ? 'bg-brand' : 'bg-line'}`}
              aria-hidden
            />
            <span className={i === 1 ? 'font-medium text-ink' : 'text-muted'}>{step}</span>
          </li>
        ))}
      </ul>

      <AiNote>보통 20~30초 걸려요. 끝나면 알려 드릴게요.</AiNote>
    </AiMessage>
  );
}
