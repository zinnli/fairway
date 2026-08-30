import { cn } from '@/lib/cn';

/**
 * 버튼 겉모습 정본 — 00_프론트_읽어주세요.md 3-1.
 * <button>과 <a>(라우터 Link)가 같은 규격을 써야 해서 클래스만 따로 뺐다.
 * 잠금은 opacity가 아니라 색 교체다. opacity를 쓰면 정의에 없는 연보라가 생긴다.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'link';
export type ButtonSize = 'lg' | 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-1 box-border font-semibold ' +
  'transition-colors select-none disabled:cursor-not-allowed';

/** scp1 / scp0 / scp3 */
const variants: Record<ButtonVariant, string> = {
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

const sizes: Record<ButtonSize, string> = {
  lg: 'h-12 px-6 text-[15px] rounded-md',       // btn1  48px
  md: 'h-11 px-5 text-[14px] rounded-md',       // btn2  44px
  sm: 'h-8 px-3 text-[12.5px] rounded-md',      // btn-sm 32px
};

export function buttonClass({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  const isBox = variant === 'primary' || variant === 'secondary';
  return cn(base, variants[variant], isBox && sizes[size], className);
}
