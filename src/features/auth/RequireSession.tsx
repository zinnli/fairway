import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { IS_MOCK } from '@/api';
import { useSessionStore } from '@/store/sessionStore';

/**
 * 로그인해야 볼 수 있는 길. `/cases` 아래를 감싼다.
 *
 * 아직 확인 중일 때는 아무것도 그리지 않는다 — 확인 전에 로그인 화면으로 보내면
 * 새로고침할 때마다 한 번 튕겼다 돌아오는 깜빡임이 생긴다.
 *
 * 사건을 보려면 반드시 로그인해야 한다 (9/5 결정). **목일 때만 예외다** —
 * 목에는 계정도 자격 검사도 없고 데이터도 브라우저 안에 있어서 지킬 것이 없다.
 * 화면만 빨리 보려는데 로그인부터 거치는 것이 걸리적거려서 열어 둔다.
 * 서버에 붙는 빌드(VITE_API=http)에서는 그대로 막는다.
 *
 * 로그인을 거쳐도 된다 — 그러면 사이드바에 그 메일이 뜨고, 안 거치면 "체험 중"이다.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const status = useSessionStore((s) => s.status);
  const { pathname, search } = useLocation();

  if (IS_MOCK) return <>{children}</>;
  if (status === 'checking') return null;
  /* 여기까지 왔다는 것은 로그인 없이 사건을 열려 했다는 뜻이다 — 로그인 화면으로 보내고
     원래 가려던 곳을 들려 보낸다. **로그아웃은 여기로 오지 않는다** — 누른 쪽이 첫 화면으로
     이미 옮긴 뒤에 세션을 내린다 (Sidebar). 그래야 목적지를 둘이 다투지 않는다 */
  if (status === 'out') {
    /* 주소창은 이미 옮겨졌는데 라우터가 아직 못 따라온 순간이 있다 —
       그때 끼어들면 진행 중인 이동을 덮어쓴다 (로그아웃이 그랬다). 따라올 때까지 비켜난다 */
    if (window.location.pathname !== pathname) return null;
    return <Navigate to="/login" replace state={{ from: `${pathname}${search}` }} />;
  }
  return <>{children}</>;
}
