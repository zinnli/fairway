import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router';
import { service, setSessionLostHandler } from '@/api';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { CasesPage } from '@/pages/CasesPage';
import { CaseWorkspacePage } from '@/pages/CaseWorkspacePage';

/**
 * 라우트는 5개뿐이다 (docs/frontend-plan.md 5절).
 * /cases/:caseId 하나가 h12~h39 + f01~f04 + m05~m13을 전부 흡수한다.
 * 온보딩은 사건이 0개일 때 뜨는 모달이라 길을 따로 내지 않는다.
 * S5(경위서 전문)·S6(반박의견서)도 라우트가 아니라 모달이다.
 *
 * MSW 대기·전역 ErrorBoundary·인증 가드가 붙는 시점에 Router를 이 파일에서 떼어낸다.
 */

/** 부품 확인용 화면. 심사 빌드에는 길을 내주지 않는다 */
const DesignSystemPage = lazy(() =>
  import('@/pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
);

/**
 * 세션 배선. 라우터 안이라야 길을 낼 수 있어서 컴포넌트로 둔다.
 *
 * · 새로고침하면 액세스 토큰이 사라진다(메모리에만 두므로) — refresh 쿠키로 한 번 되살린다
 * · 그래도 안 풀리면 로그인 화면으로 보낸다. 조용히 빈 화면이 되는 것을 막는다
 *
 * ★ 라우트 가드는 아직 세우지 않는다 — 심사위원 접속 방식(기능명세 6.3)이 미정이라
 *   체험 계정이면 가드+자동 로그인, 익명 세션이면 가드 없음으로 모양이 갈린다.
 *   목으로 도는 동안에는 401이 날 일이 없어 이 배선이 시연을 막지 않는다.
 */
function Session() {
  const navigate = useNavigate();

  useEffect(() => {
    void service.restoreSession();
    setSessionLostHandler(() => navigate('/login', { replace: true }));
    return () => setSessionLostHandler(null);
  }, [navigate]);

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
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:caseId" element={<CaseWorkspacePage />} />
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
