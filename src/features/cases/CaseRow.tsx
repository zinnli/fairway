import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
 *
 * 메뉴는 position:fixed다. 목록이 .panel-scroll(overflow-y:auto) 안에 있어서
 * absolute로 두면 아래쪽 줄의 메뉴가 스크롤 상자에 잘린다.
 */

/** 줄 아래 4px 띄우고 왼쪽에서 8px — 원래 쓰던 mt-1 · left-2와 같은 값 */
const GAP = 4;
const INSET = 8;

interface Anchor {
  top: number;
  bottom: number;
  left: number;
  viewportH: number;
}

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
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  /* 아래로 열면 화면 밖으로 나가는 줄은 위로 뒤집는다.
     paint 전에 도는 훅이라 위치가 한 번 튀어 보이지 않는다 */
  useLayoutEffect(() => {
    if (!anchor || flipped) return;
    const el = menuRef.current;
    if (el && el.getBoundingClientRect().bottom > anchor.viewportH - INSET) setFlipped(true);
  }, [anchor, flipped]);

  /* 목록을 스크롤하거나 창을 줄이면 메뉴가 제 줄에서 떨어져 나가므로 닫는다 */
  useEffect(() => {
    if (!anchor) return;
    const close = () => setAnchor(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [anchor]);

  const title = item.title ?? '이름 없는 사건';
  const menuOpen = anchor !== null;

  const openMenu = () => {
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFlipped(false);
    setAnchor({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      viewportH: window.innerHeight,
    });
  };

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
    <div>
      <div
        ref={rowRef}
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
            onClick={() => (menuOpen ? setAnchor(null) : openMenu())}
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

      {anchor && (
        <>
          {/* 바깥을 누르면 닫히도록 투명 클릭 캐처를 깐다 (h09 핸드오프 메모) */}
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setAnchor(null)}
          />
          <div
            ref={menuRef}
            role="menu"
            style={
              flipped
                ? { bottom: anchor.viewportH - anchor.top + GAP, left: anchor.left + INSET }
                : { top: anchor.bottom + GAP, left: anchor.left + INSET }
            }
            className="fixed z-20 w-46 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
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
                setAnchor(null);
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
                setAnchor(null);
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
                setAnchor(null);
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
