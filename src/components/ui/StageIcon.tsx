/**
 * 진행 단계 아이콘 — 대기 / 진행중 / 완료 (02 기능명세서 0.6 · 5.1).
 * 디자인 원본은 색을 하드코딩했지만 여기서는 토큰으로 받는다.
 */
import type { StageState } from '@/domain/case';

export function StageIcon({ state, size = 20 }: { state: StageState; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 20 20', 'aria-hidden': true, focusable: false as const };

  if (state === '완료') {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="7.5" className="fill-brand stroke-brand" strokeWidth={1.8} />
        <path d="M6.8 10.4L9 12.6L13.2 7.8" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }
  if (state === '진행중') {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="7.5" className="stroke-brand" strokeWidth={1.8} fill="none" />
        <circle cx="10" cy="10" r="3" className="fill-brand" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="10" cy="10" r="7.5" className="stroke-muted" strokeWidth={1.8} fill="none" />
      <circle cx="10" cy="10" r="3" className="stroke-muted" strokeWidth={1.8} fill="none" />
    </svg>
  );
}
