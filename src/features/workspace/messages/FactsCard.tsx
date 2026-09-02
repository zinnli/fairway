import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SelectChip } from '@/components/ui/Chip';
import { FACTS_TITLE } from '@/domain/analysis';
import { FACT_LABEL, type Fact, type FactKey } from '@/domain/fact';
import { FACT_CHOICES } from '@/domain/questions';

/**
 * 사실 확인 — h18, 고치는 중은 h19.
 * 영상에서 읽은 값을 한 줄씩 보여 주고 그 자리에서 고칠 기회를 준다.
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
  /** 고친 값을 확정한다. 출처가 "내가 말한 것"으로 바뀌고 변경 이력에 남는다 */
  onFix: (key: FactKey, value: string | null) => void;
  onConfirm: () => void;
}) {
  const [editing, setEditing] = useState<FactKey | null>(null);
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
        {facts.map((fact) =>
          editing === fact.key ? (
            <FactEditor
              key={fact.key}
              fact={fact}
              onCancel={() => setEditing(null)}
              onSave={(value) => {
                setEditing(null);
                onFix(fact.key, value);
              }}
            />
          ) : (
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
              <Button size="sm" variant="secondary" onClick={() => setEditing(fact.key)}>
                {fact.source === 'unknown' ? '알려주기' : '고칠래요'}
              </Button>
            </div>
          ),
        )}
      </div>

      <Button size="lg" className="mt-1 self-start" onClick={onConfirm} disabled={editing !== null}>
        {found}개 다 맞아요
      </Button>
      {(editing !== null || unknown > 0) && (
        <p className="text-[12.5px] text-muted">
          {editing !== null
            ? '고치는 중이에요. 저장하거나 취소하면 확정할 수 있어요.'
            : `확인 필요 ${unknown}개는 이어서 여쭤볼게요`}
        </p>
      )}
    </div>
  );
}

/** 한 줄을 고치는 중 — h19 */
function FactEditor({
  fact,
  onSave,
  onCancel,
}: {
  fact: Fact;
  onSave: (value: string | null) => void;
  onCancel: () => void;
}) {
  const choices = FACT_CHOICES[fact.key] ?? [];
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');

  const value = choices.length > 0 ? picked : typed.trim() || null;
  const chosen = choices.find((c) => c.value === picked || (c.isUnknown && picked === ''));
  const ready = choices.length > 0 ? picked !== null : typed.trim().length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-brand-line bg-bg-3 p-4">
      <div className="flex items-center gap-2">
        <span className="w-24 shrink-0 text-[13.5px] text-muted md:w-30">
          {FACT_LABEL[fact.key]}
        </span>
        <span className="min-w-0 flex-1 text-[14px] text-ink">
          {fact.source === 'unknown' ? '아직 몰라요' : fact.value}
        </span>
        <span className="shrink-0 text-[12.5px] font-medium text-brand-press">고치는 중</span>
      </div>

      <p className="text-[13.5px] leading-[1.6] text-ink">
        {FACT_LABEL[fact.key]} —{' '}
        {fact.source === 'unknown'
          ? '영상에서 읽지 못했어요. 실제는 어땠나요?'
          : `영상에서는 "${fact.value}"으로 보였어요. 실제는 어땠나요?`}
      </p>

      {choices.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {choices.map((chip) => (
            <SelectChip
              key={chip.label}
              selected={picked === chip.value && (picked !== '' || !!chip.isUnknown)}
              onClick={() => setPicked(chip.isUnknown ? '' : chip.value)}
            >
              {chip.label}
            </SelectChip>
          ))}
        </div>
      ) : (
        <input
          autoFocus
          aria-label={`${FACT_LABEL[fact.key]} 고치기`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="box-border h-11 rounded-md border border-line bg-surface px-4 text-[15px] text-ink focus-visible:border-brand"
        />
      )}

      <p className="text-[12.5px] leading-[1.5] text-muted">
        고치면 출처가 "내가 말한 것"으로 바뀌고 변경 이력에 남아요.
      </p>

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!ready}
          onClick={() => onSave(chosen?.isUnknown ? null : value)}
        >
          저장
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}
