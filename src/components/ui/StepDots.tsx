/**
 * 모바일 진행 띠 — 11_DesignSystem.html 9-0.
 * 채움 = 지금까지 온 단계(지금 포함) · 테두리 = 다음 단계.
 */
export function StepDots({ step, steps, label }: { step: number; steps: number; label: string }) {
  return (
    <div
      className="flex items-center gap-1"
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
                ? 'h-1.5 w-1.5 rounded-full bg-brand'
                : next
                  ? 'h-1.5 w-1.5 rounded-full border border-brand'
                  : 'h-1.5 w-1.5 rounded-full bg-line'
            }
          />
        );
      })}
    </div>
  );
}
