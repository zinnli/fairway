import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Sidebar } from '@/features/cases/Sidebar';
import { service } from '@/api';
import { OnboardingModal } from '@/features/onboarding/OnboardingModal';
import { useCaseStore } from '@/store/caseStore';

/**
 * S3 사건 목록 — h08(빈 상태) · h09 · h10 · h11 · f05 (모바일 m04).
 * 목록·메뉴·이름 바꾸기·삭제·로그아웃은 전부 사이드바 안에서 일어난다.
 *
 * ★ 사건이 있을 때의 오른쪽 칸은 시안에 없다(h09부터는 작업 화면이 차지한다).
 *   문구 두 줄만 새로 썼고, 디자인 담당 확인이 필요하다.
 *
 * 사건이 0개면 온보딩(h06~h07)을 이 화면 위에 얹는다. 시안이 사건 목록 위에 덮인 모달로
 * 그렸으므로 라우트가 아니다. 닫으면 표시를 남겨 다시 열리지 않고 h08 빈 상태가 드러난다.
 */
export function CasesPage() {
  const navigate = useNavigate();
  const { list, loaded, create, onboardingSeen, markOnboardingSeen } = useCaseStore();
  const empty = loaded && list.length === 0;

  return (
    <div className="flex h-dvh bg-bg-3">
      <div className="hidden h-full sm:block">
        <Sidebar />
      </div>

      <main className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 p-6">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand"
          aria-hidden
        >
          <Icon name="shield" size={28} />
        </span>
        <h1 className="text-[17px] font-semibold text-ink">
          {empty ? '아직 사건이 없어요' : '사건을 골라 주세요'}
        </h1>
        <p className="text-center text-[14px] leading-[1.6] text-ink-3">
          {empty ? (
            <>
              사고 상황을 설명하고 블랙박스 영상을 올리면
              <br />
              AI가 과실비율을 따져 드려요.
            </>
          ) : (
            <>
              왼쪽에서 이어서 볼 사건을 고르거나,
              <br />새 사건을 만들어 보세요.
            </>
          )}
        </p>
        <Button size="lg" onClick={async () => navigate(`/cases/${await create()}`)}>
          <Icon name="plus" size={16} strokeWidth={2} />새 사건 만들기
        </Button>
      </main>

      {/* 끝까지 봤든 건너뛰었든 서버에 남긴다 — 다음에 들어올 때 다시 뜨지 않게 (A-10) */}
      <OnboardingModal
        open={empty && !onboardingSeen}
        onClose={(skipped) => {
          markOnboardingSeen();
          void service.completeOnboarding(skipped);
        }}
      />
    </div>
  );
}
