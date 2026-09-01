import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Icon } from '@/components/ui/Icon';
import { SLIDES } from '@/features/onboarding/slides';
import { cn } from '@/lib/cn';

/**
 * 온보딩 3단 — h06 · h06b · h07 (모바일 m03).
 * PC는 사건 목록 위에 뜨는 640 모달, 모바일은 전체 화면 한 장이다.
 * 어디서 끝내든 사건 목록으로 간다. 건너뛰기는 항상 열려 있다.
 */

/** 넘김 표시 — 지금 장은 20×8 알약, 나머지는 8×8. 부품 규격이라 4배수 예외 */
function SlideDots({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-2"
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

export function OnboardingPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index]!;
  const isLast = index === SLIDES.length - 1;

  const finish = () => navigate('/cases');

  return (
    <div className="relative flex min-h-dvh bg-bg-3">
      {/* PC는 사건 목록 위에 뜬다. 뒤에 비치는 사이드바 자리 */}
      <div className="hidden w-65 shrink-0 border-r border-line bg-bg md:block" aria-hidden />

      <div className="flex min-w-0 flex-1 flex-col p-6 sm:absolute sm:inset-0 sm:items-center sm:justify-center sm:bg-[rgba(15,18,24,0.55)] sm:p-0">
        {/* 모바일은 머리에 글자 링크만 (m03) */}
        <div className="flex justify-end sm:hidden">
          <button
            type="button"
            onClick={finish}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-[13.5px] text-muted hover:bg-bg-2"
          >
            건너뛰기
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col sm:h-auto sm:w-160 sm:max-w-full sm:flex-none sm:rounded-lg sm:bg-surface sm:p-6 sm:shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
          <div className="relative flex flex-1 items-center justify-center rounded-lg bg-brand-tint p-4 sm:h-75 sm:flex-none sm:rounded-none">
            {slide.art}

            {slide.artBadge && <div className="absolute top-5 left-5">{slide.artBadge}</div>}

            {/* 건너뛰기·닫기는 PC 모달에만. 모바일은 위쪽 글자 링크가 대신한다 */}
            {index === 0 && (
              <button
                type="button"
                onClick={finish}
                className="absolute top-5 right-14 box-border hidden items-center rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2 hover:bg-bg sm:inline-flex"
              >
                건너뛰기
              </button>
            )}
            <div className="absolute top-4 right-4 hidden sm:block">
              <Button variant="icon" onClick={finish} aria-label="온보딩 닫기">
                <Icon name="close" size={16} />
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-8 sm:px-10 sm:py-8">
            <h1 className="text-center text-[20px] leading-[1.4] font-bold text-ink sm:text-[24px] sm:tracking-[-0.6px]">
              {slide.title}
            </h1>
            <p className="text-center text-[14px] leading-[1.6] text-ink-3 sm:text-[15px]">
              {slide.desc}
            </p>
            <SlideDots index={index} />
            {slide.disclaimer && <Disclaimer className="text-center text-[12.5px]" />}

            <div
              className={cn(
                'mt-2 flex w-full items-center gap-2',
                index === 0 ? 'justify-end' : 'justify-between',
              )}
            >
              {index > 0 && (
                <Button variant="secondary" onClick={() => setIndex(index - 1)}>
                  이전
                </Button>
              )}
              {isLast ? (
                <Button size="lg" onClick={finish} className="max-sm:w-full">
                  <Icon name="plus" size={16} strokeWidth={2} />
                  새 사건 만들기
                </Button>
              ) : (
                <Button onClick={() => setIndex(index + 1)} className="max-sm:w-full">
                  다음
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
