/**
 * 모바일 진행 띠 — m05 머리띠 규격(12px · 간격 8).
 * 채움 = 지금까지 온 단계(지금 포함) · 나머지는 흰 바탕에 가는 테두리.
 */
export function StepDots({ step, steps, label }: { step: number; steps: number; label: string }) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={steps}
      aria-label={label}
      data-step={step}
      data-steps={steps}
    >
      {Array.from({ length: steps }, (_, i) => {
        const n = i + 1;
        const filled = n <= step;
        const next = n === step + 1;
        return (
          <span
            key={n}
            aria-hidden
            className={
              filled
                ? 'h-3 w-3 rounded-full bg-brand'
                : next
                  ? 'box-border h-3 w-3 rounded-full border border-brand-line bg-surface'
                  : 'box-border h-3 w-3 rounded-full border border-line bg-surface'
            }
          />
        );
      })}
    </div>
  );
}
