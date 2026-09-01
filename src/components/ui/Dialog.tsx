import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

/**
 * 팝업 6종(P-1~P-6)의 공통 껍데기.
 * 네이티브 <dialog>를 쓰면 포커스 트랩·Esc·inert가 브라우저 기본으로 온다.
 * 닫기 버튼은 44 (00 문서 4절 — 32에서 44로 고친 항목).
 *
 * 머리·바닥 규격은 h40 기준이다: 머리 20/32 + 아래선, 제목 20px, 바닥 16/32/20 + 윗선.
 */
export function Dialog({
  open,
  onClose,
  title,
  badge,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 제목 오른쪽 배지 (예: h40의 [필수]) */
  badge?: ReactNode;
  children: ReactNode;
  /** 바닥. 왼쪽 설명이 필요하면 flex-1을 준 요소를 먼저 넣는다 */
  footer?: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

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
      aria-labelledby={titleId}
      className="m-auto w-[calc(100vw-32px)] rounded-lg bg-surface p-0 text-ink backdrop:bg-[rgba(15,18,24,.55)]"
      style={{ maxWidth: width }}
    >
      <div className="flex max-h-[80dvh] flex-col">
        <header className="flex flex-none items-center gap-3 border-b border-line px-8 py-5">
          <h2 id={titleId} className="min-w-0 flex-1 text-[20px] font-bold">
            {title}
          </h2>
          {badge}
          <Button variant="icon" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={16} />
          </Button>
        </header>
        <div className="doc-scroll flex-1 px-8 py-6">{children}</div>
        {footer && (
          <footer className="flex flex-none items-center gap-3 border-t border-line px-8 pt-4 pb-5">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
