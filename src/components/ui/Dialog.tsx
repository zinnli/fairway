import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

/**
 * 팝업 6종(P-1~P-6)의 공통 껍데기.
 * 네이티브 <dialog>를 쓰면 포커스 트랩·Esc·inert가 브라우저 기본으로 온다.
 * 닫기 버튼은 44 (00 문서 4절 — 32에서 44로 고친 항목).
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
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
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      aria-labelledby="dialog-title"
      className="m-auto w-[calc(100vw-32px)] rounded-lg bg-surface p-0 text-ink backdrop:bg-[rgba(17,20,26,.36)]"
      style={{ maxWidth: width }}
    >
      <div className="flex max-h-[80dvh] flex-col">
        <header className="flex flex-none items-center gap-2 px-6 pt-5 pb-3">
          <h2 id="dialog-title" className="flex-1 text-[17px] font-bold">{title}</h2>
          <Button variant="icon" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={20} />
          </Button>
        </header>
        <div className="panel-scroll flex-1 px-6 pb-5">{children}</div>
        {footer && (
          <footer className="flex flex-none justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
