import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * 옆에서 나오는 서랍 — 좁은 화면에서 사이드바(왼쪽)와 현황판(오른쪽)이 이걸 쓴다.
 * 10_디자인.html h09 주석의 폭 규칙:
 *   1280 이상 둘 다 고정 · 1024~1280 현황판만 서랍 · 1024 미만 둘 다 서랍.
 *
 * Dialog와 같은 이유로 네이티브 <dialog>다 — 포커스 트랩·Esc·inert가 기본으로 온다.
 * 모달 <dialog>는 position:fixed에 margin:auto라 가운데로 온다. 한쪽 여백만 auto로 두어 붙인다.
 * 폭은 주지 않는다. 안에 들어가는 사이드바(260)·현황판(340)이 제 폭을 갖고 있다.
 */
export function Drawer({
  open,
  onClose,
  side,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: 'left' | 'right';
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
      /* 어두워진 바깥을 누르면 닫는다. ::backdrop 클릭은 <dialog> 자신에게 오므로
         target이 서랍 자신일 때만 닫으면 된다 (안쪽을 누르면 자식이 target이다) */
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={label}
      className={cn(
        'my-0 h-dvh max-h-none max-w-none bg-transparent p-0 text-ink',
        'backdrop:bg-[rgba(15,18,24,.55)]',
        side === 'left' ? 'mr-auto ml-0' : 'mr-0 ml-auto',
      )}
    >
      {/* showModal()은 첫 번째 누를 수 있는 것에 초점을 준다. 그대로 두면 서랍을 열자마자
          [새 사건]에 초점 테두리가 그려진다. 껍데기가 먼저 받아 두고 넘긴다 */}
      <div className="h-full outline-none" tabIndex={-1} autoFocus>
        {children}
      </div>
    </dialog>
  );
}
