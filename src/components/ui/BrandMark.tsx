import { APP_NAME } from '@/config';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * 로고 + 서비스 이름. h01 머리글 · h02~h05 카드 머리 · h08 사이드바에서 같은 모양으로 쓴다.
 * 이름이 미확정이라 글자는 APP_NAME에서만 나온다.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-brand text-white"
        aria-hidden
      >
        <Icon name="shield" size={16} />
      </span>
      <span className="text-[15px] font-bold text-ink">{APP_NAME}</span>
    </span>
  );
}
