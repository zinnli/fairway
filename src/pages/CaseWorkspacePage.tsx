import { PendingScreen } from './PendingScreen';

/** S4 작업 화면. 라우트 하나가 40여 화면을 흡수한다 (frontend-plan 5절).
 *  대화는 추가만, 삭제 없음. S5 경위서 전문 · S6 반박의견서는 검색 파라미터로 여는 서랍이다 */
export function CaseWorkspacePage() {
  return <PendingScreen title="S4 작업 화면" screens="h12~h39 · f01~f04 · m05~m13" />;
}
