import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * 상호작용 상태 정본 — 00_프론트_읽어주세요.md 3-1.
 * 잠금은 opacity가 아니라 색 교체다. opacity를 쓰면 정의에 없는 연보라가 생긴다.
 */

type Variant = 'primary' | 'secondary' | 'icon' | 'link';
type Size = 'lg' | 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-1 box-border font-semibold ' +
  'transition-colors select-none disabled:cursor-not-allowed';

/** scp1 / scp0 / scp3 */
const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-press ' +
    'active:bg-brand-press active:shadow-[inset_0_2px_4px_rgba(0,0,0,.18)] ' +
    'disabled:bg-bg-2 disabled:text-disabled disabled:shadow-none',
  secondary:
    'bg-surface text-ink border border-line ' +
    'hover:bg-bg hover:border-brand-line active:bg-brand-tint ' +
    'disabled:bg-bg-2 disabled:text-disabled disabled:border-line',
  icon:
    'text-muted rounded-lg hover:bg-bg-2 ' +
    'min-h-11 min-w-11 sm:min-h-8 sm:min-w-8 ' + // 모바일 44 예외 없음 / PC 32
    'disabled:bg-transparent disabled:text-disabled',
  link:
    'text-muted hover:bg-bg-2 rounded-lg px-2 ' +
    'min-h-11 sm:min-h-8 disabled:text-disabled',
};

const sizes: Record<Size, string> = {
  lg: 'h-12 px-6 text-[15px] rounded-md',       // btn1  48px
  md: 'h-11 px-5 text-[14px] rounded-md',       // btn2  44px
  sm: 'h-8 px-3 text-[12.5px] rounded-md',      // btn-sm 32px
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** 잠금일 때 이유를 함께 보여 준다 (예: "경위서를 만들면 열려요") */
  lockedReason?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  lockedReason,
  disabled,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isBox = variant === 'primary' || variant === 'secondary';
  const btn = (
    <button
      type={type}
      disabled={disabled}
      className={cn(base, variants[variant], isBox && sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  );

  if (!lockedReason || !disabled) return btn;
  return (
    <span className="inline-flex flex-col items-start gap-1">
      {btn}
      <span className="text-[12px] text-muted">{lockedReason}</span>
    </span>
  );
}
