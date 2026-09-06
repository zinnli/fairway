import { APP_NAME } from '@/config';
import { cn } from '@/lib/cn';

/**
 * 좌상단 로고 — 사이드바(h08) · 첫 화면 머리글(h01) · 로그인·회원가입 카드 머리(h02~h05).
 *
 * 마크와 글자가 한 덩어리인 **완성 로고 한 장**(`public/logo.svg`)을 쓴다.
 * 그래서 옆에 이름을 따로 쓰지 않는다 — 쓰면 "FAIRWAY FAIRWAY"가 된다.
 * 이름은 그림 안에 있으므로 대체 글자로만 내보낸다(`alt`).
 *
 * 그림은 파일에서 나온다. 코드 안에 path를 그려 넣지 않는다 — 로고가 바뀌면 파일만
 * 갈아 끼우면 되고, 자바스크립트 묶음도 그만큼 가벼워진다.
 * 마크만 필요한 자리는 `public/logo-mark.svg`, 탭 아이콘은 `public/favicon.svg`다.
 *
 * 크기 — 높이만 정하고 폭은 따라오게 둔다(가로세로 약 6:1 · 16px이면 폭 98px).
 * **기준은 로고 전체 높이가 아니라 그 안의 글자다.** "AIRWAY"가 위아래를 거의 꽉
 * 채우므로(154 중 147) 높이를 예전 마크(28px)에 맞추면 글자만 27px이 되어
 * 이름표(15px 굵게)의 두 배로 보인다. 16px이면 글자가 약 15px로 앉는다.
 *
 * 감싼 span을 남겨 둔 이유 — 부르는 쪽이 `flex-1`을 준다(HomePage).
 * 그걸 그림에 바로 걸면 가로로 늘어난다.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center', className)}>
      <img
        src="/logo.svg"
        alt={APP_NAME}
        width={942}
        height={154}
        className="block h-4 w-auto shrink-0"
      />
    </span>
  );
}
