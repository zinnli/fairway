import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useSessionStore } from '@/store/sessionStore';

/**
 * 로그인해야 볼 수 있는 길. `/cases` 아래를 감싼다.
 *
 * 아직 확인 중일 때는 아무것도 그리지 않는다 — 확인 전에 로그인 화면으로 보내면
 * 새로고침할 때마다 한 번 튕겼다 돌아오는 깜빡임이 생긴다.
 *
 * 사건을 보려면 반드시 로그인해야 한다 (9/5 결정).
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const status = useSessionStore((s) => s.status);
  const exit = useSessionStore((s) => s.exit);
  const { pathname, search } = useLocation();

  if (status === 'checking') return null;
  if (status === 'out') {
    /* 내가 눌러서 나갔으면 첫 화면(F05), 쓰다가 풀렸으면 로그인 화면.
       로그인 화면으로 갈 때만 원래 가려던 곳을 들려 보낸다 */
    return (
      <Navigate
        to={exit}
        replace
        state={exit === '/login' ? { from: `${pathname}${search}` } : undefined}
      />
    );
  }
  return <>{children}</>;
}
