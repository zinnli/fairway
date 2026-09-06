import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Sidebar } from '@/features/cases/Sidebar';
import { isApiError, service } from '@/api';
import { OnboardingModal } from '@/features/onboarding/OnboardingModal';
import { useCaseStore } from '@/store/caseStore';
import { useSessionStore } from '@/store/sessionStore';

/**
 * S3 사건 목록 — h08(빈 상태) · h09 · h10 · h11 · f05 (모바일 m04).
 * 목록·메뉴·이름 바꾸기·삭제·로그아웃은 전부 사이드바 안에서 일어난다.
 *
 * ★ 사건이 있을 때의 오른쪽 칸은 시안에 없다(h09부터는 작업 화면이 차지한다).
 *   문구 두 줄만 새로 썼고, 디자인 담당 확인이 필요하다.
 *
 * 온보딩(h06~h07)은 이 화면 위에 얹는다. 시안이 사건 목록 위에 덮인 모달로 그렸으므로
 * 라우트가 아니다. 닫으면 표시를 남겨 다시 열리지 않고 h08 빈 상태가 드러난다.
 *
 * **뜨는 기준은 "이 계정이 아직 온보딩을 보지 않았는가" 하나다** — 서버가 A-10으로 기억한다.
 * 끝까지 봤든 건너뛰었든 기록이 남고, 그 뒤로는 다시 뜨지 않는다.
 *
 * 전에는 "사건이 0개"까지 함께(AND) 걸어 뒀는데, 사건이 하나라도 있으면 갓 가입한 사람에게도
 * 뜨지 않았다 — 목으로 볼 때는 시연 사건이 시드로 깔려 있어 아예 뜰 수가 없었다 (9/6 지적).
 * 사건 0개는 트리거가 아니라 배경이다: 갓 가입한 계정은 자연히 0개이고, 온보딩을 닫으면
 * 그 아래에서 h08(빈 상태)이 드러난다. 0개를 트리거로 삼으면 이미 본 사람이 사건을 다 지웠을 때
 * 또 뜨게 되어 A-10 기록이 무의미해진다.
 */
export function CasesPage() {
  const navigate = useNavigate();
  const { list, loaded, create, onboardingSeen, markOnboardingSeen } = useCaseStore();
  /* 서버가 기억하는 온보딩 기록(A-10). 세션 안 표시(onboardingSeen)만으로는
     새로고침하면 다시 떠서, 계정에 남는 이 기록을 함께 본다 */
  const onboardedAt = useSessionStore((s) => s.user?.onboardedAt ?? null);
  const empty = loaded && list.length === 0;
  /* 목록을 읽기 전에는 띄우지 않는다 — 뒤에 비칠 화면이 정해지기 전에 덮으면 한 번 번쩍인다 */
  const onboarding = loaded && !onboardingSeen && onboardedAt === null;
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /* 더블클릭이 사건을 두 개 만들지 않게 잠그고, 실패는 침묵하지 않는다.
     서버가 완성 문장을 줬으면 그대로 쓴다(명세 §2.3) */
  const newCase = async () => {
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      navigate(`/cases/${await create()}`);
    } catch (e) {
      setCreateError(
        isApiError(e) ? e.body.message : '사건을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setCreating(false);
    }
  };

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
        <Button size="lg" onClick={() => void newCase()} disabled={creating}>
          <Icon name="plus" size={16} strokeWidth={2} />새 사건 만들기
        </Button>
        {createError && <p className="text-[12.5px] font-medium text-danger">{createError}</p>}
      </main>

      {/* 끝까지 봤든 건너뛰었든 서버에 남긴다 — 다음에 들어올 때 다시 뜨지 않게 (A-10) */}
      <OnboardingModal
        open={onboarding}
        onClose={(skipped) => {
          markOnboardingSeen();
          void service.completeOnboarding(skipped);
        }}
      />
    </div>
  );
}
