import type { ReactNode } from 'react';

/** 내가 한 말 — 오른쪽 정렬, 연보라, 꼬리 쪽 모서리만 4 */
export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-140 min-w-0 self-end rounded-lg rounded-br-xs bg-brand-tint px-4 py-3 text-[15px] leading-[1.6] text-ink">
      {children}
    </div>
  );
}
