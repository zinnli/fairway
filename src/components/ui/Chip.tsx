import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { FACT_SOURCE_LABEL, type FactSource } from '@/domain/fact';

/**
 * 의미색은 점·글자·가는 선으로만. 면 채움은 배너에서만 (11_DesignSystem.html).
 * 그래서 출처 칩은 배경이 흰색이고 색은 6px 점 하나로만 드러낸다.
 */
const DOT: Record<FactSource, string> = {
  video: 'bg-brand',        // [영상] 보라
  statement: 'bg-teal',     // [내가 말한 것] 청록
  unknown: 'bg-sand',       // [확인 필요] 모래
};

export function SourceChip({ source }: { source: FactSource }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 box-border rounded-full',
        'border border-line bg-surface px-2 py-1',
        'text-[12px] font-medium leading-[1.35]',
        source === 'unknown' ? 'text-sand-text' : 'text-ink-2',
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[source])} aria-hidden />
      {FACT_SOURCE_LABEL[source]}
    </span>
  );
}

/** 질문 선택 칩 — h44. 모바일 터치 영역 예외 없음 */
export interface SelectChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function SelectChip({ selected, className, ...rest }: SelectChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'box-border inline-flex h-11 items-center rounded-full px-5',
        'text-[14px] font-medium leading-[1.35] transition-colors',
        selected
          ? 'border border-brand bg-brand-tint text-ink'
          : 'border border-line bg-surface text-ink hover:border-brand-line hover:bg-bg active:bg-brand-tint',
        className,
      )}
      {...rest}
    />
  );
}
