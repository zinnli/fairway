import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/lib/cn';

/**
 * 입력칸 — h02·h03·h04·h05·h22·h28 공통.
 * 오류는 테두리 색 교체 + 아래 한 줄. 잠금은 opacity가 아니라 색 교체다.
 *
 * 초점 규격(00 문서 3-1)은 입력칸만 예외로 테두리 1.5px brand + 링 3px brand-tint다.
 * 링은 theme.css의 base 규칙이 주지만, 테두리 색은 utilities 레이어가 이기므로
 * 여기서 focus-visible 유틸리티로 다시 준다.
 */

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** 오류 문구. 있으면 테두리가 danger로 바뀌고 아래에 붙는다 */
  error?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Field({ label, error, className, ref, ...rest }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[12.5px] font-medium text-muted">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'box-border h-11 rounded-md border bg-surface px-4 text-[15px] text-ink',
          'placeholder:text-muted focus-visible:border-brand',
          'disabled:bg-bg-2 disabled:text-disabled',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-[12.5px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
