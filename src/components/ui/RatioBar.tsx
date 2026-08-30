import { formatRatio, type Ratio } from '@/domain/verdict';

/**
 * 비율 막대 — 빨강·초록 금지. 잉크 숫자 + 보라 듀오톤 (11_DesignSystem.html).
 * 높이 8/10은 간격이 아니라 부품 규격이라 4배수 예외.
 */
export function RatioBar({
  label,
  ratio,
  emphasis = false,
}: {
  label: string;
  ratio: Ratio;
  /** 우리 판정은 진한 보라 + 굵은 글자, 상대 주장은 연보라 */
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12.5px]">
        <span className={emphasis ? 'font-semibold text-muted' : 'text-muted'}>{label}</span>
        <span className={emphasis ? 'tnum font-semibold text-ink' : 'tnum text-ink-3'}>
          {formatRatio(ratio)}
        </span>
      </div>
      <div
        className="flex overflow-hidden rounded-full bg-track"
        style={{ height: emphasis ? 10 : 8 }}
        role="img"
        aria-label={`${label} ${formatRatio(ratio)}`}
      >
        <div style={{ width: `${ratio.mine}%` }} className="h-full bg-transparent" />
        <div
          style={{ width: `${ratio.opponent}%` }}
          className={emphasis ? 'h-full bg-brand' : 'h-full bg-brand-line'}
        />
      </div>
    </div>
  );
}
