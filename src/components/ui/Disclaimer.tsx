import { DISCLAIMER } from '@/config';

/** 규칙 0.2 — 판정·서류가 보이는 곳 하단에 고정. 한 화면에 한 번만 */
export function Disclaimer({ className }: { className?: string }) {
  return <p className={`text-[12px] leading-relaxed text-muted ${className ?? ''}`}>{DISCLAIMER}</p>;
}
