import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

/**
 * 카드가 되는 AI 메시지의 껍데기 — 판정(h21)과 서류(h26·h28)가 함께 쓴다.
 *
 * 말풍선(AiMessage)과 다르다. 저쪽은 방패 아이콘 + 왼쪽 여백 28로 배경 위에 그냥 얹히고,
 * 이쪽은 흰 면에 그림자를 두른 카드다 — **단추까지 카드 안에 들어간다.**
 * 폭 560이 정본이고 여백은 모바일 16 / PC 24다 (시안 h21 · h26 · h28).
 */
export function MessageCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex w-full max-w-140 min-w-0 flex-col gap-3 rounded-lg bg-surface p-4 shadow-[0_4px_12px_rgba(17,20,26,0.06)] md:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 머리글 오른쪽 알약 — "두 번째 버전 · 2장" */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="box-border shrink-0 rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2">
      {children}
    </span>
  );
}

/** 서류 카드 머리글 — 아이콘 + 제목 + 알약 (시안 h26 · h28이 같은 값이다) */
export function CardHeader({
  icon,
  title,
  badge,
}: {
  icon: IconName;
  title: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex shrink-0 text-muted" aria-hidden>
        <Icon name={icon} size={17} />
      </span>
      <p className="min-w-0 flex-1 text-[17px] font-semibold text-ink">{title}</p>
      {badge}
    </div>
  );
}

/** 라벨 48px + 값 — 반박의견서 카드의 받는이·접수번호·제목·첨부 줄 (시안 h28) */
export function FieldRow({
  label,
  children,
  align = 'baseline',
}: {
  label: string;
  children: ReactNode;
  /** 첨부처럼 값이 여러 줄이면 라벨을 위로 붙인다 */
  align?: 'baseline' | 'start';
}) {
  return (
    <div className={cn('flex gap-2 text-[13.5px]', align === 'start' ? 'items-start' : 'items-baseline')}>
      <span className={cn('w-12 shrink-0 text-muted', align === 'start' && 'pt-1')}>{label}</span>
      <span className="flex min-w-0 flex-col gap-1">{children}</span>
    </div>
  );
}
