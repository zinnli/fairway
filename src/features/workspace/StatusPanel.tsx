import { Icon } from '@/components/ui/Icon';
import { DISCLAIMER } from '@/config';
import { RatioTrack } from '@/components/ui/RatioBar';
import { StageIcon } from '@/components/ui/StageIcon';
import { STAGE_LABELS, type Case } from '@/domain/case';
import type { Rebuttal, Statement } from '@/domain/document';
import { versionLabel } from '@/lib/document';
import { formatRatio } from '@/domain/verdict';
import { cn } from '@/lib/cn';

/**
 * HiStatus — 원본에 data-sc-name="HiStatus"로 표시된 부품. 25화면이 이것을 공유한다.
 * 폭 340 고정. 1280 미만에서는 접히는데, 768 이상은 오른쪽 서랍이고 그 아래는
 * 아래에서 올라오는 시트다(m09). 껍데기는 작업 화면이 씌운다.
 *
 * 9/3 축소로 "확인된 사실"·"영상에서 찾은 사실" 묶음과 [변경 이력 보기]가 빠졌다
 * (04 문서 C2·C3). 남는 것은 예상 과실비율 · 진행 단계 · 서류 세 덩이다.
 */

function SectionTitle({ icon, children }: { icon: 'clock' | 'file'; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1 text-[12px] font-semibold text-muted">
      <Icon name={icon} size={14} />
      {children}
    </p>
  );
}

/**
 * 서류 줄 — scp5라 최소 높이 44.
 * 열 서류가 없으면 진짜로 잠근다. 눌러도 아무 일이 없는 단추를 두지 않는다.
 * 잠금은 opacity가 아니라 색 교체다.
 */
function DocRow({
  label,
  value,
  disabled,
  onOpen,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="-mx-2 flex min-h-11 items-start gap-2 rounded-sm px-2 py-2 text-left text-[13.5px] hover:bg-bg-2 disabled:bg-transparent disabled:text-disabled disabled:hover:bg-transparent"
    >
      <span className={cn('w-20 shrink-0', disabled ? 'text-disabled' : 'text-ink-3')}>{label}</span>
      <span className={cn('min-w-0 flex-1 leading-[1.4]', disabled ? 'text-disabled' : 'text-ink')}>
        {value}
      </span>
      {!disabled && (
        <span className="flex shrink-0 text-muted" aria-hidden>
          <Icon name="chevronRight" size={14} />
        </span>
      )}
    </button>
  );
}

export function StatusPanel({
  item,
  statement,
  rebuttal,
  showDisclaimer,
  onOpenStatement,
  onOpenRebuttal,
}: {
  item: Case;
  /** 지금까지 만들어진 서류. 없으면 "만들기"가 되고, 만들 수도 없으면 잠긴다 */
  statement: Statement | null;
  rebuttal: Rebuttal | null;
  /** 참고용 고지는 화면당 한 번만(규칙 0.2). 대화 카드가 이미 달고 있으면 여기선 뺀다 */
  showDisclaimer: boolean;
  onOpenStatement: () => void;
  onOpenRebuttal: () => void;
}) {
  const ratio = item.verdict?.ratio ?? null;

  /* 줄 하나가 세 가지 상태를 가진다 — 잠김 / 눌러서 만들기 / 눌러서 열기.
     "보낼 수 있어요"라고 써 놓고 눌리지 않는 줄을 만들지 않는다 */
  const statementRow = statement
    ? { value: `${versionLabel(statement.version)} · ${statement.pageCount}장`, locked: false }
    : item.verdict
      ? { value: '아직 없음 · 눌러서 만들기', locked: false }
      : { value: '잠김 · 판정이 먼저예요', locked: true };

  /* 보낸 뒤에는 초안의 sentAt이 아니라 단계를 본다 — 초안은 보내기 전 모습 그대로다 (4.4) */
  const sent = item.stages.rebuttal === '완료';
  const rebuttalRow = sent
    ? { value: '발송 완료', locked: false }
    : rebuttal
      ? { value: '보낼 수 있어요', locked: false }
      : statement
        ? { value: '이제 만들 수 있어요', locked: false }
        : { value: '잠김 · 판정과 경위서가 먼저예요', locked: true };

  return (
    <div className="flex h-full w-full shrink-0 flex-col overflow-hidden border-line bg-bg sm:w-85 sm:border-l">
      <h2 className="flex-none px-5 pt-4 pb-3 text-[15px] font-bold text-ink">사건 현황판</h2>

      <div className="panel-scroll flex flex-1 flex-col gap-6 px-5 pb-4">
        <div className="flex-none rounded-lg bg-surface p-4 shadow-[0_4px_12px_rgba(17,20,26,0.06)]">
          <p className="mb-1 text-[12px] font-semibold text-muted">예상 과실비율</p>
          {ratio ? (
            <>
              <p
                className="tnum text-[26px] font-bold tracking-[-0.02em] text-ink"
                aria-label={formatRatio(ratio)}
              >
                나 {ratio.mine} <span className="font-normal text-muted">:</span> 상대{' '}
                {ratio.opponent}
              </p>
              <RatioTrack ratio={ratio} emphasis label="예상 과실비율" className="mt-2" />
            </>
          ) : (
            <p className="text-[13.5px] text-muted">아직 판정 전이에요.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <SectionTitle icon="clock">진행 단계</SectionTitle>
          {STAGE_LABELS.map(({ key, label }) => {
            const state = item.stages[key];
            return (
              <div key={key} className="flex items-center gap-2">
                <StageIcon state={state} size={15} />
                <span
                  className={cn(
                    'min-w-0 flex-1 text-[13.5px]',
                    state === '대기' ? 'text-muted' : 'text-ink',
                  )}
                >
                  {label}
                </span>
                {state === '대기' && (
                  <span className="text-[12.5px] font-medium text-muted">대기</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-1">
          <SectionTitle icon="file">서류</SectionTitle>
          <DocRow
            label="사건경위서"
            value={statementRow.value}
            disabled={statementRow.locked}
            onOpen={onOpenStatement}
          />
          <DocRow
            label="반박의견서"
            value={rebuttalRow.value}
            disabled={rebuttalRow.locked}
            onOpen={onOpenRebuttal}
          />
        </div>
      </div>

      {showDisclaimer && (
        <p className="flex-none border-t border-line px-5 py-3 text-[12.5px] leading-[1.5] text-muted">
          {DISCLAIMER}
        </p>
      )}
    </div>
  );
}
