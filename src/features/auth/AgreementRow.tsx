import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { TERMS, type TermKey } from './terms';

/**
 * 필수 동의 한 줄 — h04·h05. scp3 규격이라 행 높이는 최소 44다.
 * 체크박스 20×20 · 반경 6 · 테두리 1.5px는 부품 규격이라 4배수 예외.
 */
export function AgreementRow({
  term,
  checked,
  onToggle,
  onOpen,
}: {
  term: TermKey;
  checked: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { label } = TERMS[term];

  return (
    <div className="flex min-h-11 items-center gap-2">
      <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="peer sr-only"
        />
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] box-border',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
            checked ? 'border-brand bg-brand text-white' : 'border-disabled bg-surface',
          )}
          aria-hidden
        >
          {checked && <Icon name="checkSmall" size={14} strokeWidth={2} />}
        </span>
        <span className="min-w-0 flex-1 text-[13.5px] leading-[1.5] text-ink-3">
          <span className="font-semibold text-brand">[필수]</span> {label}
        </span>
      </label>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-[12.5px] font-medium text-brand hover:bg-bg-2 sm:min-h-8"
      >
        보기
      </button>
    </div>
  );
}
