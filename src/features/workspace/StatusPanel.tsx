import { Icon } from '@/components/ui/Icon';
import { DISCLAIMER } from '@/config';
import { RatioTrack } from '@/components/ui/RatioBar';
import { StageIcon } from '@/components/ui/StageIcon';
import { STAGE_LABELS, type Case } from '@/domain/case';
import { FACT_SOURCE_LABEL, factCountLabel, type Fact, type FactSource } from '@/domain/fact';
import { formatRatio } from '@/domain/verdict';
import { cn } from '@/lib/cn';

/**
 * HiStatus — 원본에 data-sc-name="HiStatus"로 표시된 부품. 25화면이 이것을 공유한다.
 * 폭 340 고정. 1280 미만에서는 오른쪽 서랍으로 접히고, 그 껍데기는 작업 화면이 씌운다.
 *
 * 확인된 사실 개수는 저장하지 않고 factCountLabel()로 파생한다.
 */

const DOT: Record<FactSource, string> = {
  video: 'bg-brand',
  statement: 'bg-teal',
  unknown: 'bg-sand',
};

/** 사실 칩 — 출처는 6px 색점으로만 말한다. 색점은 부품 규격이라 4배수 예외 */
function FactChip({ fact }: { fact: Fact }) {
  const text = fact.value ?? `${FACT_SOURCE_LABEL.unknown}`;
  return (
    <span
      className={cn(
        'box-border inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1',
        'text-[12px] leading-[1.35] font-medium',
        fact.source === 'unknown' ? 'text-sand-text' : 'text-ink-2',
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[fact.source])} aria-hidden />
      {text}
    </span>
  );
}

function SectionTitle({ icon, children }: { icon: 'clock' | 'checkCircle' | 'file'; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1 text-[12px] font-semibold text-muted">
      <Icon name={icon} size={14} />
      {children}
    </p>
  );
}

/** 서류 줄 — scp5라 최소 높이 44 */
function DocRow({ label, value, onOpen }: { label: string; value: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="-mx-2 flex min-h-11 items-start gap-2 rounded-sm px-2 py-2 text-left text-[13.5px] hover:bg-bg-2"
    >
      <span className="w-20 shrink-0 text-ink-3">{label}</span>
      <span className="min-w-0 flex-1 leading-[1.4] text-ink">{value}</span>
      <span className="flex shrink-0 text-muted" aria-hidden>
        <Icon name="chevronRight" size={14} />
      </span>
    </button>
  );
}

export function StatusPanel({
  item,
  onOpenStatement,
  onOpenRebuttal,
  onOpenHistory,
}: {
  item: Case;
  onOpenStatement: () => void;
  onOpenRebuttal: () => void;
  onOpenHistory: () => void;
}) {
  const ratio = item.verdict?.ratio ?? null;
  const statementValue = item.stages.statement === '완료' ? '만듦' : '아직 없음';
  const rebuttalValue =
    item.stages.statement === '완료' ? '보낼 수 있어요' : '잠김 · 판정과 경위서가 먼저예요';

  return (
    <div className="flex h-full w-85 shrink-0 flex-col overflow-hidden border-l border-line bg-bg">
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

        <div className="flex flex-col gap-2">
          <SectionTitle icon="checkCircle">
            {item.facts.length > 0 ? factCountLabel(item.facts) : '확인된 사실'}
          </SectionTitle>
          {item.facts.length === 0 ? (
            <p className="text-[13.5px] text-muted">영상을 올리면 여기에 쌓여요.</p>
          ) : (
            <>
              <div className="flex items-center gap-3 text-[12px] leading-[1.35] text-muted">
                {(['video', 'statement', 'unknown'] as FactSource[]).map((source) => (
                  <span key={source} className="inline-flex items-center gap-1">
                    <span
                      className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[source])}
                      aria-hidden
                    />
                    {source === 'statement' ? '내가 말함' : FACT_SOURCE_LABEL[source]}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {item.facts.map((fact) => (
                  <FactChip key={fact.key} fact={fact} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <SectionTitle icon="file">서류</SectionTitle>
          <DocRow label="사건경위서" value={statementValue} onOpen={onOpenStatement} />
          <DocRow label="반박의견서" value={rebuttalValue} onOpen={onOpenRebuttal} />
        </div>

        <button
          type="button"
          onClick={onOpenHistory}
          className="-mx-2 flex min-h-11 items-center gap-1 self-start rounded-sm px-2 text-[13.5px] text-ink-3 hover:bg-bg-2 sm:min-h-8"
        >
          <Icon name="retry" size={14} />
          변경 이력 보기
        </button>
      </div>

      <p className="flex-none border-t border-line px-5 py-3 text-[12.5px] leading-[1.5] text-muted">
        {DISCLAIMER}
      </p>
    </div>
  );
}
