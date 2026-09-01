import { StatusBadge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import type { Case } from '@/domain/case';

/**
 * 대화 열 맨 위 — h12·h14·h21 등 작업 화면 전부가 공유한다.
 * 대화와 같이 스크롤된다(시안에서 .chat-scroll 안에 들어 있다).
 *
 * 제목은 분석 전까지 null이라 "새 사건"으로 부른다. AI가 이름을 붙이면 바뀐다.
 */
function monthDay(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ChatHeader({ item }: { item: Case }) {
  return (
    <header className="-mb-3 flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 text-brand" aria-hidden>
          <Icon name="shield" size={20} />
        </span>
        <h1 className="min-w-0 truncate text-[20px] font-bold text-ink">
          {item.title ?? '새 사건'}
        </h1>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[13.5px] text-muted">접수 {monthDay(item.createdAt)}</span>
        <StatusBadge status={item.status} />
      </div>
      <div className="mt-1 h-px bg-line" />
    </header>
  );
}
