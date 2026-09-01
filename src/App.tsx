import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { CasesPage } from '@/pages/CasesPage';
import { CaseWorkspacePage } from '@/pages/CaseWorkspacePage';

/**
 * 라우트는 6개뿐이다 (docs/frontend-plan.md 5절).
 * /cases/:caseId 하나가 h12~h39 + f01~f04 + m05~m13을 전부 흡수한다.
 * S5(경위서 전문)·S6(반박의견서)는 라우트가 아니라 검색 파라미터로 여는 서랍이다.
 *
 * MSW 대기·전역 ErrorBoundary·인증 가드가 붙는 시점에 Router를 이 파일에서 떼어낸다.
 */

/** 부품 확인용 화면. 심사 빌드에는 길을 내주지 않는다 */
const DesignSystemPage = lazy(() =>
  import('@/pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
);

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
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
