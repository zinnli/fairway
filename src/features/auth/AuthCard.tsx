import type { ReactNode } from 'react';
import { BrandMark } from '@/components/ui/BrandMark';

/**
 * 로그인·회원가입 카드 셸 — h02 h03 h04 h05 / m02.
 * PC는 400px 카드, 모바일은 카드 테를 벗고 화면 그대로 쓴다(m02).
 */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg-3 p-6">
      <div className="flex w-full max-w-100 flex-col gap-4 sm:rounded-lg sm:border sm:border-line sm:bg-surface sm:p-6">
        <BrandMark />
        <h1 className="text-[20px] font-bold text-ink">{title}</h1>
        {children}
      </div>
    </main>
  );
}
