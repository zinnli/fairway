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
  bodyClass = 'px-5 py-5 sm:px-8 sm:py-6',
  dismissible = true,
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
  /**
   * 본문 여백 — 시안마다 다르다 (h30은 32/40).
   * **모바일 값도 같이 준다.** 375 화면에서 32px씩 물리면 글 자리가 279px밖에 안 남는다.
   */
  bodyClass?: string;
  /**
   * 닫을 수 있는가. false면 나가는 길 **셋을 모두** 막는다 — ×·Esc·바깥 닫힘.
   * 되돌릴 수 없는 일이 도는 동안 쓴다 (메일 발송은 동기라 1~3초 걸린다).
   * 하나만 막으면 나머지로 빠져나가 결과를 모르는 채로 남는다.
   */
  dismissible?: boolean;
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
      onClose={dismissible ? onClose : undefined}
      onCancel={(e) => {
        /* Esc는 언제나 기본 닫힘을 막는다 — 닫을지는 우리가 정한다 */
        e.preventDefault();
        if (dismissible) onClose();
      }}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100vw-32px)] rounded-lg bg-surface p-0 text-ink backdrop:bg-[rgba(15,18,24,.55)]"
      style={{ maxWidth: width }}
    >
      {/* showModal()은 첫 번째 누를 수 있는 것에 초점을 준다. 그대로 두면 열자마자
          닫기 ×에 초점 테두리가 그려진다. 껍데기가 먼저 받아 둔다 */}
      <div className="flex max-h-[85dvh] flex-col outline-none" tabIndex={-1} autoFocus>
        {/* 여백은 모바일 20 / PC 32 — 시안의 좌우 여백 16 고정(모바일)과 짝이 맞는다 */}
        <header className="flex flex-none items-center gap-3 border-b border-line px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {icon}
            <h2 id={titleId} className="truncate text-[20px] font-bold">
              {title}
            </h2>
            {badge}
          </div>
          <Button variant="icon" onClick={onClose} aria-label="닫기" disabled={!dismissible}>
            <Icon name="close" size={16} />
          </Button>
        </header>
        <div className={cn('doc-scroll flex-1', bodyClass)}>{children}</div>
        {footer && (
          <footer className="flex flex-none items-center gap-3 border-t border-line px-5 pt-4 pb-4 sm:px-8 sm:pb-5">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
