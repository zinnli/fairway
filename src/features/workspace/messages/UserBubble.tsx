import type { ReactNode } from 'react';

/** 내가 한 말 — 오른쪽 정렬, 연보라, 꼬리 쪽 모서리만 4.
 *  모바일은 280·14 (m05), PC는 560·15 (h12) */
export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-70 min-w-0 self-end rounded-lg rounded-br-xs bg-brand-tint px-3 py-3 text-[14px] leading-[1.6] text-ink md:max-w-140 md:px-4 md:text-[15px]">
      {children}
    </div>
  );
}
