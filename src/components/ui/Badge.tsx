import { cn } from '@/lib/cn';
import type { CaseStatus } from '@/domain/case';

/** 사건 상태 배지 — 규칙 0.5 */
const DOT: Record<CaseStatus, string> = {
  '접수중': 'bg-disabled',
  '분석중': 'bg-brand',
  '확인 필요': 'bg-sand',
  '판정 완료': 'bg-teal',
  '발송 완료': 'bg-teal',
  '종결': 'bg-disabled',
};

export function StatusBadge({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 box-border rounded-full',
        'border border-line bg-surface px-2 py-1',
        'text-[12px] font-medium leading-[1.35] text-ink-2',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[status])} aria-hidden />
      {status}
    </span>
  );
}
