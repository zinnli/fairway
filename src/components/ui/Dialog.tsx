import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
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
  icon,
  children,
  footer,
  width = 560,
  bodyClass = 'px-8 py-6',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** 제목 오른쪽 배지 (예: h40의 [필수], h30의 버전 알약) */
  badge?: ReactNode;
  /** 제목 왼쪽 아이콘 (h30의 서류 아이콘) */
  icon?: ReactNode;
  children: ReactNode;
  /** 바닥. 왼쪽 설명이 필요하면 flex-1을 준 요소를 먼저 넣는다 */
  footer?: ReactNode;
  width?: number;
  /** 본문 여백 — 시안마다 다르다 (h30은 32/40) */
  bodyClass?: string;
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
      {/* showModal()은 첫 번째 누를 수 있는 것에 초점을 준다. 그대로 두면 열자마자
          닫기 ×에 초점 테두리가 그려진다. 껍데기가 먼저 받아 둔다 */}
      <div className="flex max-h-[85dvh] flex-col outline-none" tabIndex={-1} autoFocus>
        <header className="flex flex-none items-center gap-3 border-b border-line px-8 py-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {icon}
            <h2 id={titleId} className="truncate text-[20px] font-bold">
              {title}
            </h2>
            {badge}
          </div>
          <Button variant="icon" onClick={onClose} aria-label="닫기">
            <Icon name="close" size={16} />
          </Button>
        </header>
        <div className={cn('doc-scroll flex-1', bodyClass)}>{children}</div>
        {footer && (
          <footer className="flex flex-none items-center gap-3 border-t border-line px-8 pt-4 pb-5">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
