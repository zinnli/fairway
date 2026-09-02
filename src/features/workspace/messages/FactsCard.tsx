import { Button } from '@/components/ui/Button';
import { FACTS_TITLE } from '@/domain/analysis';
import { FACT_LABEL, type Fact, type FactKey } from '@/domain/fact';

/**
 * 사실 확인 — h18. 영상에서 읽은 값을 한 줄씩 보여 주고 고칠 기회를 준다.
 * 못 읽은 항목은 [확인 필요]로 두고 왜 못 읽었는지 함께 말한다.
 *
 * 개수는 저장하지 않고 facts에서 파생한다.
 */
export function FactsCard({
  facts,
  onFix,
  onConfirm,
}: {
  facts: Fact[];
  onFix: (key: FactKey) => void;
  onConfirm: () => void;
}) {
  const found = facts.filter((f) => f.source === 'video').length;
  const unknown = facts.filter((f) => f.source === 'unknown').length;

  return (
    <div className="flex w-full max-w-140 min-w-0 flex-col gap-3 rounded-lg bg-surface p-4 shadow-[0_4px_12px_rgba(17,20,26,0.06)] md:p-6">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="min-w-0 flex-1 text-[15px] font-semibold text-ink">{FACTS_TITLE}</h3>
        <p className="text-[12.5px] text-muted">
          표시 없는 항목은 <span className="font-medium text-brand">영상</span>에서 찾았어요
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {facts.map((fact) => (
          <div key={fact.key} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-[13.5px] text-muted md:w-30">
              {FACT_LABEL[fact.key]}
            </span>
            {fact.source === 'unknown' ? (
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="inline-flex items-center gap-1 text-[14px] text-sand-text">
                  {/* 6px 색점 — 부품 규격이라 4배수 예외 */}
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sand" aria-hidden />
                  아직 몰라요
                </span>
                {fact.note && <span className="text-[12.5px] text-muted">{fact.note}</span>}
              </span>
            ) : (
              <span className="min-w-0 flex-1 text-[14px] text-ink">{fact.value}</span>
            )}
            <Button size="sm" variant="secondary" onClick={() => onFix(fact.key)}>
              {fact.source === 'unknown' ? '알려주기' : '고칠래요'}
            </Button>
          </div>
        ))}
      </div>

      <Button size="lg" className="mt-1 self-start" onClick={onConfirm}>
        {found}개 다 맞아요
      </Button>
      {unknown > 0 && (
        <p className="text-[12.5px] text-muted">확인 필요 {unknown}개는 이어서 여쭤볼게요</p>
      )}
    </div>
  );
}
