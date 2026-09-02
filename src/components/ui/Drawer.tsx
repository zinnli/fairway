import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * 옆·아래에서 나오는 서랍 — 좁은 화면에서 사이드바와 현황판이 이걸 쓴다.
 * 10_디자인.html h09 주석의 폭 규칙:
 *   1280 이상 둘 다 고정 · 1024~1280 현황판만 서랍 · 1024 미만 둘 다 접힘.
 *
 * 나오는 방향은 시안이 정한다:
 *   m04 사건 서랍 — 왼쪽에서, 폭 300
 *   m09 현황 시트 — 모바일에서는 아래에서 올라오는 시트(높이 84% · 위 모서리 16 · 손잡이 40×4).
 *                   768 이상에서는 오른쪽 서랍이 된다.
 *
 * <dialog>는 화면 전체를 덮게 두고 그 안에 판을 붙인다.
 * ::backdrop을 눌렀는지 따지는 것보다, 판 바깥을 눌렀는지 보는 편이 확실하다.
 * 네이티브 <dialog>라 포커스 트랩·Esc·inert는 기본으로 온다.
 */
const PANELS = {
  left: 'mr-auto h-full',
  right: 'ml-auto h-full',
  sheet: cn(
    'mt-auto h-[84dvh] w-full rounded-t-lg shadow-[0_-9px_24px_rgba(0,0,0,0.14)]',
    'sm:mt-0 sm:ml-auto sm:h-full sm:w-auto sm:rounded-none sm:shadow-none',
  ),
} as const;

export function Drawer({
  open,
  onClose,
  side,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: keyof typeof PANELS;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /* 닫기 콜백은 화면에서 인라인으로 넘어와 렌더마다 바뀐다. 거울에 담아 두고
     아래 이벤트 등록이 매번 다시 붙지 않게 한다 */
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  /* 판 바깥을 누르면 닫는다.
     React의 onClick으로는 안 걸린다 — 모달 <dialog>는 최상위 레이어라 합성 이벤트가
     오지 않는 경우가 있다. 그래서 요소에 직접 붙인다 */
  useEffect(() => {
    const el = ref.current;
    if (!el || !open) return;
    const onClick = (e: MouseEvent) => {
      if (e.detail === 0) return; // 키보드로 누른 것은 건드리지 않는다
      if (!panelRef.current?.contains(e.target as Node)) closeRef.current();
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={label}
      className={cn(
        'm-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden bg-transparent p-0 text-ink',
        'backdrop:bg-[rgba(15,18,24,.55)]',
      )}
    >
      <div className="flex h-full w-full">
        {/* showModal()은 첫 번째 누를 수 있는 것에 초점을 준다. 그대로 두면 서랍을 열자마자
            [새 사건]에 초점 테두리가 그려진다. 판이 먼저 받아 두고 넘긴다 */}
        <div
          ref={panelRef}
          tabIndex={-1}
          autoFocus
          className={cn('flex min-h-0 flex-col overflow-hidden outline-none', PANELS[side])}
        >
          {side === 'sheet' && (
            /* 손잡이 40×4 (m09). 768 이상에서는 오른쪽 서랍이라 손잡이가 없다 */
            <div className="flex flex-none justify-center bg-bg pt-2 sm:hidden">
              <span className="h-1 w-10 rounded-full bg-line-3" aria-hidden />
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </dialog>
  );
}
