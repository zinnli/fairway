import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { setSessionLostHandler } from '@/api';
import { RequireSession } from '@/features/auth/RequireSession';
import { useSessionStore } from '@/store/sessionStore';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { CasesPage } from '@/pages/CasesPage';
import { CaseWorkspacePage } from '@/pages/CaseWorkspacePage';

/**
 * 라우트는 5개뿐이다 (docs/frontend-plan.md 5절).
 * /cases/:caseId 하나가 h12~h37 + f01·f03·f04 + m05~m13을 전부 흡수한다.
 * (h39·f02는 9/3 축소로 빠졌다 — docs/handoff/04_기획변경.md)
 * 온보딩은 사건이 0개일 때 뜨는 모달이라 길을 따로 내지 않는다.
 * S5(경위서 전문)·S6(반박의견서)도 라우트가 아니라 모달이다.
 *
 * 인증 가드는 RequireSession으로 붙였다. 전역 ErrorBoundary가 붙는 시점에
 * Router를 이 파일에서 떼어낸다. (MSW는 쓰지 않는다 — 목이 계약을 직접 구현한다)
 */

/** 부품 확인용 화면. 심사 빌드에는 길을 내주지 않는다 */
const DesignSystemPage = lazy(() =>
  import('@/pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
);

/**
 * 세션 배선.
 *
 * · 새로고침하면 액세스 토큰이 사라진다(메모리에만 두므로) — 뜰 때 한 번 되살린다
 * · 쓰는 도중 401이 끝내 안 풀리면 세션을 내린다. 가드가 로그인 화면으로 보낸다
 */
function Session() {
  const boot = useSessionStore((s) => s.boot);
  const expire = useSessionStore((s) => s.expire);

  useEffect(() => {
    void boot();
    setSessionLostHandler(expire);
    return () => setSessionLostHandler(null);
  }, [boot, expire]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <Session />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/cases"
          element={
            <RequireSession>
              <CasesPage />
            </RequireSession>
          }
        />
        <Route
          path="/cases/:caseId"
          element={
            <RequireSession>
              <CaseWorkspacePage />
            </RequireSession>
          }
        />
        {import.meta.env.DEV && (
          <Route
            path="/design-system"
            element={
              <Suspense fallback={null}>
                <DesignSystemPage />
              </Suspense>
            }
          />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
