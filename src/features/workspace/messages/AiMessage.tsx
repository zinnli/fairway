import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * AI가 하는 말의 공통 껍데기 — 말풍선이 아니라 방패 아이콘 + 왼쪽 여백 28이다.
 * 폭은 560이 정본(00 문서 6절). 좁아지면 줄지만 넓어지지는 않는다.
 */
export function AiMessage({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex w-full max-w-140 min-w-0 flex-col gap-2 pl-7">
      <span className="absolute top-0.5 left-0 flex text-brand" aria-hidden>
        <Icon name="shield" size={16} />
      </span>
      {children}
    </div>
  );
}

/** AI 본문 한 줄 */
export function AiText({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-[1.6] text-ink">{children}</p>;
}

/** 본문 아래 붙는 작은 설명 — 정보 글자라 muted까지만 */
export function AiNote({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] leading-[1.5] text-muted">{children}</p>;
}
