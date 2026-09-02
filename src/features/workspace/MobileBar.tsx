import { Icon } from '@/components/ui/Icon';
import { StepDots } from '@/components/ui/StepDots';
import { currentStage, type Case } from '@/domain/case';

/**
 * 좁은 화면 머리띠 — m05. 높이 44 · 아래 가는 선.
 * 왼쪽 햄버거(사이드바 열기) · 가운데 진행 띠 + 지금 단계 이름 · 오른쪽 [현황].
 *
 * 폭 규칙(시안 h09 주석)에 따라 1280 이상에서는 띠 자체가 없고,
 * 1024~1280에서는 사이드바가 붙박이라 햄버거만 감춘다.
 *
 * 단계 이름은 stages에서 파생한다 — 저장하면 재판정 때 어긋난다.
 */
export function MobileBar({
  item,
  onOpenCases,
  onOpenStatus,
}: {
  item: Case | null;
  onOpenCases: () => void;
  onOpenStatus: () => void;
}) {
  const stage = item ? currentStage(item.stages) : null;

  return (
    <div className="flex h-11 flex-none items-center gap-2 border-b border-line px-3 lg:hidden">
      <button
        type="button"
        onClick={onOpenCases}
        aria-label="내 사건 열기"
        className="-ml-3 flex h-11 w-11 shrink-0 items-center justify-center text-ink-3 hover:bg-bg-2 md:hidden"
      >
        <Icon name="menu" size={20} />
      </button>

      {stage && (
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <StepDots
            step={stage.step}
            steps={stage.steps}
            label={`진행 상황 — 전체 ${stage.steps}단계 중 ${stage.step}단계 ${stage.label}`}
          />
          <span className="truncate text-[12px] font-semibold text-brand-press">{stage.label}</span>
        </div>
      )}

      {/* 보이는 알약은 32지만 감싼 상자는 44다 — 모바일 터치 규격에 예외를 두지 않는다 */}
      <button
        type="button"
        onClick={onOpenStatus}
        className="-mr-3 flex h-11 shrink-0 items-center px-3"
      >
        <span className="box-border flex h-8 items-center rounded-md border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink">
          현황
        </span>
      </button>
    </div>
  );
}
