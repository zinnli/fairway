import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ANALYZE_STEPS } from '@/domain/analysis';
import { cn } from '@/lib/cn';
import { AiMessage, AiNote } from './AiMessage';

/**
 * 분석 중 — h16. 지금 무엇을 보고 있는지 단계로 말해 준다.
 * 카드를 새로 쌓지 않고 이 자리에서 단계만 바뀐다(쌓으면 스크롤이 초당 몇 번씩 튄다).
 *
 * 목이 보내는 label은 단계의 doing 문구다. 못 알아보면 그 줄만 보여 준다.
 */
export function AnalyzingCard({
  step,
  done,
  onStop,
}: {
  step: string;
  done?: boolean;
  onStop: () => void;
}) {
  const at = ANALYZE_STEPS.findIndex((s) => s.doing === step);
  const current = done ? ANALYZE_STEPS.length : at;
  const percent = Math.round(((current + 1) / ANALYZE_STEPS.length) * 100);

  return (
    <AiMessage className="gap-3">
      <p className="text-[15px] font-semibold text-ink">
        {done ? '영상을 다 봤어요' : '영상을 분석하고 있어요'}
      </p>

      <div className="flex flex-col gap-2 text-[14px] leading-[1.5]">
        {at === -1 && !done ? (
          <StepRow state="doing">{step}</StepRow>
        ) : (
          ANALYZE_STEPS.map((s, i) => (
            <StepRow key={s.doing} state={i < current ? 'done' : i === current ? 'doing' : 'wait'}>
              {i < current ? s.done : i === current ? s.doing : s.wait}
            </StepRow>
          ))
        )}
      </div>

      {!done && (
        <>
          <div className="h-2 overflow-hidden rounded-full bg-line-2">
            <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
          </div>
          <AiNote>보통 1~2분 걸려요. 끝나면 알려 드릴게요.</AiNote>
          <Button variant="secondary" className="self-start" onClick={onStop}>
            분석 멈추기
          </Button>
        </>
      )}
    </AiMessage>
  );
}

function StepRow({ state, children }: { state: 'done' | 'doing' | 'wait'; children: string }) {
  return (
    <div className="flex items-center gap-2">
      {state === 'done' ? (
        <span className="flex shrink-0 text-brand" aria-hidden>
          <Icon name="check" size={14} strokeWidth={2} />
        </span>
      ) : (
        /* 8px 점 — 부품 규격이라 4배수 예외 */
        <span
          className={cn(
            'mx-1 h-2 w-2 shrink-0 rounded-full',
            state === 'doing' ? 'bg-brand' : 'bg-line',
          )}
          aria-hidden
        />
      )}
      <span
        className={cn(
          state === 'done' ? 'text-ink-3' : state === 'doing' ? 'font-medium text-ink' : 'text-muted',
        )}
      >
        {children}
      </span>
    </div>
  );
}
