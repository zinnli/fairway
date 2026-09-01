import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { SLIDES } from './slides';

/**
 * 온보딩 3단 — h06 · h06b · h07 (모바일 m03).
 * 시안이 사건 목록 위에 덮인 640 모달로 그렸으므로 라우트가 아니라 모달이다.
 * 뒤에는 진짜 사이드바가 비친다. 모바일에서는 전체 화면 한 장이 된다.
 *
 * 보라 그림 상자는 PC 300 · 모바일 280 고정이다. 남는 자리를 먹게 두면 장마다 높이가 달라져
 * 넘길 때 그림이 커졌다 작아졌다 한다. 모바일은 대신 위아래 여백이 늘어난다(m03).
 *
 * 네이티브 <dialog>라 포커스 트랩·Esc·inert가 브라우저 기본으로 온다.
 * Esc는 건너뛰기와 같다 — 어디서 끝내든 닫히기만 하고 사건 목록이 드러난다.
 */

/** 넘김 표시 — 지금 장은 20×8 알약, 나머지는 8×8. 부품 규격이라 4배수 예외 */
function SlideDots({ index, className }: { index: number; className?: string }) {
  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="progressbar"
      aria-valuenow={index + 1}
      aria-valuemin={1}
      aria-valuemax={SLIDES.length}
      aria-label={`온보딩 ${SLIDES.length}장 중 ${index + 1}장`}
      data-step={index + 1}
      data-steps={SLIDES.length}
    >
      {SLIDES.map((slide, i) => (
        <span
          key={typeof slide.title === 'string' ? slide.title : i}
          aria-hidden
          className={cn('h-2 rounded-full', i === index ? 'w-5 bg-brand' : 'w-2 bg-line')}
        />
      ))}
    </div>
  );
}

export function OnboardingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const isLast = index === SLIDES.length - 1;

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
      className={cn(
        'm-0 h-dvh max-h-none w-full max-w-none bg-bg-3 p-6 text-ink',
        'backdrop:bg-[rgba(15,18,24,.55)]',
        'sm:m-auto sm:h-fit sm:max-h-[calc(100dvh-32px)] sm:w-172 sm:max-w-[calc(100vw-32px)]',
        'sm:overflow-y-auto sm:rounded-lg sm:bg-surface sm:shadow-[0_8px_24px_rgba(0,0,0,0.14)]',
      )}
    >
      <div className="flex h-full min-w-0 flex-col outline-none sm:h-auto" tabIndex={-1} autoFocus>
        {/* 모바일은 머리에 글자 링크만 (m03) */}
        <div className="flex justify-end sm:hidden">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-[13.5px] text-muted hover:bg-bg-2"
          >
            건너뛰기
          </button>
        </div>

        <div className="relative flex h-70 flex-none items-center justify-center rounded-lg bg-brand-tint p-4 max-sm:mt-auto sm:h-75 sm:rounded-none">
          {slide.art}

          {slide.artBadge && <div className="absolute top-5 left-5">{slide.artBadge}</div>}

          {/* 건너뛰기 알약·닫기는 PC 모달에만. 모바일은 위쪽 글자 링크가 대신한다 */}
          {index === 0 && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-14 box-border hidden items-center rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2 hover:bg-bg sm:inline-flex"
            >
              건너뛰기
            </button>
          )}
          <div className="absolute top-4 right-4 hidden sm:block">
            <Button variant="icon" onClick={onClose} aria-label="온보딩 닫기">
              <Icon name="close" size={16} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 pt-8 sm:px-10 sm:py-8">
          <h1
            id={titleId}
            className="text-center text-[20px] leading-[1.4] font-bold text-ink sm:text-[24px] sm:tracking-[-0.6px]"
          >
            {slide.title}
          </h1>
          <p className="text-center text-[14px] leading-[1.6] text-ink-3 sm:text-[15px]">
            {slide.desc}
          </p>
          <SlideDots index={index} className="max-sm:mt-auto" />
          {slide.disclaimer && <Disclaimer className="text-center text-[12.5px]" />}

          <div
            className={cn(
              'mt-2 flex w-full items-center gap-2',
              index === 0 ? 'justify-end' : 'justify-between',
            )}
          >
            {index > 0 && (
              <Button
                variant="secondary"
                onClick={() => setIndex(index - 1)}
                className="max-sm:shrink-0"
              >
                이전
              </Button>
            )}
            {isLast ? (
              <Button size="lg" onClick={onClose} className="max-sm:flex-1">
                <Icon name="plus" size={16} strokeWidth={2} />
                새 사건 만들기
              </Button>
            ) : (
              <Button onClick={() => setIndex(index + 1)} className="max-sm:flex-1">
                다음
              </Button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
