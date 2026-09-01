import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import type { CaseSummary } from '@/domain/case';
import { cn } from '@/lib/cn';

/**
 * 사이드바 사건 한 줄 — h09(목록·메뉴) · h10(이름 바꾸기).
 * scp5 규격이라 행 높이는 최소 44다.
 *
 * 핸드오프 메모(h09): 선택되지 않은 줄의 ⋯ 버튼은 평소 숨기고 hover·focus 때만 보인다.
 * 히트 영역 32는 항상 유지한다.
 */
export function CaseRow({
  item,
  selected,
  onRename,
  onDelete,
  onHistory,
}: {
  item: CaseSummary;
  selected: boolean;
  onRename: (title: string) => void;
  onDelete: () => void;
  onHistory: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const title = item.title ?? '이름 없는 사건';

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-line-2 bg-surface p-3">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onRename(draft.trim() || title);
              setEditing(false);
            }
            if (e.key === 'Escape') setEditing(false);
          }}
          aria-label="사건 이름"
          className="box-border h-11 rounded-md border border-brand bg-surface px-3 text-[13.5px] font-semibold text-ink"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onRename(draft.trim() || title);
              setEditing(false);
            }}
          >
            저장
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
            취소
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'group flex min-h-11 flex-col items-stretch gap-1 rounded-md px-3 py-2',
          selected ? 'border border-line-2 bg-surface' : 'hover:bg-bg',
        )}
      >
        <div className="flex items-center gap-2">
          <Link
            to={`/cases/${item.id}`}
            className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink"
          >
            {title}
          </Link>
          <button
            type="button"
            aria-label={`${title} 메뉴`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              '-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-muted',
              'hover:bg-bg-2 focus-visible:opacity-100 group-hover:opacity-100',
              selected || menuOpen ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Icon name="more" size={16} />
          </button>
        </div>
        <StatusBadge status={item.status} className="self-start" />
      </div>

      {menuOpen && (
        <>
          {/* 바깥을 누르면 닫히도록 투명 클릭 캐처를 깐다 (h09 핸드오프 메모) */}
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute top-full left-2 z-20 mt-1 w-46 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
          >
            <p className="mb-1 truncate border-b border-line-2 px-4 py-2 text-[12px] leading-[1.35] text-muted">
              {title}
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDraft(item.title ?? '');
                setEditing(true);
                setMenuOpen(false);
              }}
              className="flex min-h-11 w-full items-center px-4 py-3 text-[13.5px] text-ink hover:bg-bg"
            >
              이름 바꾸기
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onHistory();
                setMenuOpen(false);
              }}
              className="flex min-h-11 w-full items-center px-4 py-3 text-[13.5px] text-ink hover:bg-bg"
            >
              변경 이력
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onDelete();
                setMenuOpen(false);
              }}
              className="mt-1 flex min-h-11 w-full items-center border-t border-line-2 px-4 py-3 text-[13.5px] text-danger hover:bg-danger-fill"
            >
              사건 삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}
