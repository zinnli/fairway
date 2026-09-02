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
 * Dialog와 같은 이유로 네이티브 <dialog>다 — 포커스 트랩·Esc·inert가 기본으로 온다.
 * 모달 <dialog>는 position:fixed에 margin:auto라 가운데로 온다. 한쪽 여백만 auto로 두어 붙인다.
 * 옆 서랍의 폭은 주지 않는다 — 안에 들어가는 사이드바·현황판이 제 폭을 갖고 있다.
 */
const SIDES = {
  left: 'my-0 mr-auto ml-0 h-dvh',
  right: 'my-0 mr-0 ml-auto h-dvh',
  /* ml-0/mr-0을 따로 쓴다 — mx-0(margin-inline)은 뒤에 오는 sm:ml-auto를 덮어써서
     넓은 화면에서 오른쪽으로 못 가고 왼쪽에 붙어 버린다 */
  sheet: cn(
    'mt-auto mb-0 ml-0 h-[84dvh] w-dvw rounded-t-lg shadow-[0_-9px_24px_rgba(0,0,0,0.14)]',
    'mr-0 sm:my-0 sm:mr-0 sm:ml-auto sm:h-dvh sm:w-auto sm:rounded-none sm:shadow-none',
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
  side: keyof typeof SIDES;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      /* 어두워진 바깥을 누르면 닫는다. ::backdrop 클릭은 <dialog> 자신에게 오지만,
         상자 밖 좌표까지 같이 보는 편이 확실하다(자식이 상자를 다 덮고 있어도 걸린다).
         detail이 0이면 키보드로 누른 것이라 건드리지 않는다 */
      onClick={(e) => {
        const el = ref.current;
        if (!el || e.detail === 0) return;
        const box = el.getBoundingClientRect();
        const outside =
          e.clientX < box.left ||
          e.clientX > box.right ||
          e.clientY < box.top ||
          e.clientY > box.bottom;
        if (outside) onClose();
      }}
      aria-label={label}
      className={cn(
        /* <dialog>의 기본 overflow:auto를 끈다. 안 끄면 시트 안의 .panel-scroll과
           서랍 자체가 각각 스크롤돼 스크롤이 두 겹으로 생긴다 */
        'max-h-none max-w-none overflow-hidden bg-transparent p-0 text-ink',
        'backdrop:bg-[rgba(15,18,24,.55)]',
        SIDES[side],
      )}
    >
      {/* showModal()은 첫 번째 누를 수 있는 것에 초점을 준다. 그대로 두면 서랍을 열자마자
          [새 사건]에 초점 테두리가 그려진다. 껍데기가 먼저 받아 두고 넘긴다 */}
      <div className="flex h-full flex-col overflow-hidden outline-none" tabIndex={-1} autoFocus>
        {side === 'sheet' && (
          /* 손잡이 40×4 (m09). 768 이상에서는 오른쪽 서랍이라 손잡이가 없다 */
          <div className="flex flex-none justify-center bg-bg pt-2 sm:hidden">
            <span className="h-1 w-10 rounded-full bg-line-3" aria-hidden />
          </div>
        )}
        {/* 손잡이가 차지한 만큼 줄어들어야 한다. h-full로 두면 그 높이만큼 넘쳐서
            서랍이 통째로 한 번 더 스크롤된다 */}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </dialog>
  );
}
