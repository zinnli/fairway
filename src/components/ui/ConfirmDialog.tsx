import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';

/**
 * 확인 팝업 — h11(사건 삭제) · f05(로그아웃) · h35(발송 확인).
 * 제목 한 줄 + 설명 한 문단 + [취소][실행]. 닫기 X는 없다.
 *
 * 되돌릴 수 없는 행동이면 confirmVariant="danger"를 준다.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmVariant?: Extract<ButtonVariant, 'primary' | 'danger'>;
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
      className="m-auto w-[calc(100vw-32px)] max-w-100 rounded-lg bg-surface p-6 text-ink backdrop:bg-[rgba(15,18,24,.55)]"
    >
      <div className="flex flex-col gap-3">
        <h2 id={titleId} className="text-[17px] font-semibold text-ink">
          {title}
        </h2>
        <p className="text-[14px] leading-[1.6] text-ink-3">{description}</p>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
