import { cn } from '@/lib/cn';

/**
 * 점 세 개가 차례로 깜빡인다 — 기다림을 알리는 유일한 표시다.
 * 카드 등장(150ms)과 이것 말고 다른 움직임은 쓰지 않는다 (00 문서 6절).
 *
 * 색은 `currentColor`를 따라간다 — 잠긴 단추 안에서는 잠금 글자색이 되므로
 * "잠금은 opacity가 아니라 색 교체" 규칙이 저절로 지켜진다.
 * 6px 점은 간격이 아니라 부품 규격이라 4배수 예외다.
 *
 * **읽어 주지 않는다.** 무슨 일을 기다리는지는 늘 옆 글자가 말하고 있어서,
 * 여기에 이름을 달면 단추 이름이 "다시 쓰는 중 다시 쓰는 중"으로 겹쳐 읽힌다.
 */
export function Dots({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-1', className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="anim-blink h-1.5 w-1.5 rounded-full bg-current"
          style={{ animationDelay: `${i * 160}ms` }}
          aria-hidden
        />
      ))}
    </span>
  );
}
