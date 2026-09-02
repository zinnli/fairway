import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClass, type ButtonSize, type ButtonVariant } from './styles';

/**
 * 겉모습은 styles.ts가 정본이다 (<a>도 같은 규격을 써야 해서).
 * 여기서는 <button>으로서의 동작(잠금·이유 캡션)만 다룬다.
 */

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
  const btn = (
    <button
      type={type}
      disabled={disabled}
      className={buttonClass({ variant, size, className })}
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
