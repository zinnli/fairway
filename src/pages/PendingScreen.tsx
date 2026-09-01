import { Link } from 'react-router';
import { buttonClass } from '@/components/ui/Button';

/**
 * 아직 만들지 않은 화면의 임시 본문.
 * 화면이 완성되면 그 페이지 파일에서 이 컴포넌트를 지운다.
 * 다섯 페이지가 전부 완성되면 이 파일도 지운다.
 */
export function PendingScreen({ title, screens }: { title: string; screens: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="text-[13.5px] text-muted">{screens}</p>
      </div>
      <Link to="/" className={buttonClass({ variant: 'secondary' })}>
        첫 화면으로
      </Link>
    </main>
  );
}
