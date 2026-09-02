import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { RatioBar } from '@/components/ui/RatioBar';
import { DISCLAIMER } from '@/config';
import { APP_NAME } from '@/config';
import { diffPoints, formatRatio, type Precedent, type Ratio, type Verdict } from '@/domain/verdict';
import { cn } from '@/lib/cn';

/**
 * 판정 — h21. 61화면의 기준 화면이다.
 * 숫자마다 근거를 붙인다: 인정기준 도표 · 심의사례 · 쟁점.
 * 도표 번호는 미확정이라 chartNo가 null이면 번호 칸을 아예 숨긴다.
 *
 * 재판정 결과(h25)는 previous가 붙은 같은 카드다.
 */
export function VerdictCard({
  verdict,
  previous,
  onOpenChart,
  onOpenPrecedent,
  onCreateStatement,
  onOpponentClaim,
  withDisclaimer,
}: {
  verdict: Verdict;
  previous?: Ratio;
  onOpenChart: () => void;
  onOpenPrecedent: (precedent: Precedent) => void;
  onCreateStatement: () => void;
  /** 상대 보험사 주장을 받아 나란히 비교한다 (h22). 선택 입력이라 건너뛸 수 있다 */
  onOpponentClaim: (ratio: Ratio) => void;
  withDisclaimer?: boolean;
}) {
  const { ratio, opponentClaim } = verdict;
  const gap = opponentClaim ? diffPoints(opponentClaim, ratio) : 0;

  return (
    <div className="flex w-full max-w-140 min-w-0 flex-col gap-3 rounded-lg bg-surface p-4 shadow-[0_4px_12px_rgba(17,20,26,0.06)] md:p-6">
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 text-brand" aria-hidden>
          <Icon name="shield" size={16} />
        </span>
        <p className="min-w-0 flex-1 text-[13.5px] font-semibold text-ink">
          {previous ? '다시 판정했어요' : '예상 과실비율'}
        </p>
        <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2">
          근거 {verdict.precedents.length + 1}건 · 쟁점 {verdict.disputes.length}건
        </span>
      </div>

      {previous && (
        <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
          <span className="text-muted">이전</span>
          <span className="tnum text-ink-3">{formatRatio(previous)}</span>
          <span className="text-muted" aria-hidden>
            →
          </span>
          <span className="text-muted">새 판정</span>
          <span className="tnum font-semibold text-ink">{formatRatio(ratio)}</span>
        </div>
      )}

      {!previous && (
        <p
          className="tnum text-[36px] leading-[1.2] font-bold tracking-[-0.02em] text-ink"
          aria-label={formatRatio(ratio)}
        >
          <span className="mr-2 align-middle text-[13.5px] font-medium text-muted">나</span>
          {ratio.mine}
          <span className="mx-2 font-normal text-muted">:</span>
          <span className="mr-2 align-middle text-[13.5px] font-medium text-muted">상대</span>
          {ratio.opponent}
        </p>
      )}

      <p className="text-[15px] leading-[1.6] text-ink">{verdict.conclusion}</p>

      {opponentClaim && (
        <div className="flex flex-col gap-3">
          <RatioBar label="상대 보험사 주장" ratio={opponentClaim} />
          <RatioBar label={`${APP_NAME} 판정`} ratio={ratio} emphasis />
          <p className="text-[12.5px] text-brand-press">
            {gap !== 0 && <span aria-hidden>{gap > 0 ? '↓ ' : '↑ '}</span>}
            {gap === 0
              ? '상대 보험사 주장과 같은 비율이 나왔어요'
              : `상대 보험사 주장보다 내 과실이 ${Math.abs(gap)}%p ${gap > 0 ? '낮게' : '높게'} 나왔어요`}
            <span className="text-muted"> · %p는 비율끼리의 차이예요</span>
          </p>
        </div>
      )}

      <div className="h-px bg-line" />

      <div className="flex flex-col gap-1">
        <p className="text-[12px] font-semibold text-muted">근거</p>

        <GroundRow onOpen={onOpenChart}>
          <span className="text-ink">
            인정기준 도표
            {verdict.chartNo && <span className="tnum"> {verdict.chartNo}</span>} — {verdict.chartName}
          </span>
        </GroundRow>

        {verdict.precedents.map((p) => (
          <GroundRow key={p.no} onOpen={() => onOpenPrecedent(p)}>
            <span className="min-w-0 flex-1 truncate text-ink">
              심의사례 {p.no} · {p.summary}
            </span>
            <span className="tnum shrink-0 rounded-full border border-line px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2">
              {Math.round(p.match * 100)}% 일치
            </span>
          </GroundRow>
        ))}

        {verdict.disputes.map((d) => (
          <div key={d} className="flex items-center gap-2 px-2 py-2 text-[13.5px]">
            {/* 6px 색점 — 부품 규격이라 4배수 예외 */}
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sand" aria-hidden />
            <span className="min-w-0 flex-1 text-ink">쟁점 — {d}</span>
            <span className="shrink-0 rounded-full border border-line px-2 py-1 text-[12px] leading-[1.35] font-medium text-sand-text">
              확인 필요
            </span>
          </div>
        ))}
      </div>

      {!opponentClaim && <OpponentClaimForm onSubmit={onOpponentClaim} />}

      <Button size="lg" className="mt-1 self-start" onClick={onCreateStatement}>
        사건경위서 만들기
        <span aria-hidden>→</span>
      </Button>

      {withDisclaimer && (
        <p className="text-[12.5px] leading-[1.5] text-muted">{DISCLAIMER}</p>
      )}
    </div>
  );
}

/** 근거 한 줄 — scp4 (호버 #F6F7F9) */
function GroundRow({ children, onOpen }: { children: React.ReactNode; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        '-mx-2 flex min-h-11 items-center gap-2 rounded-sm px-2 py-2 text-left text-[13.5px] hover:bg-bg',
      )}
    >
      <span className="flex shrink-0 text-muted" aria-hidden>
        <Icon name="file" size={14} />
      </span>
      {children}
      <span className="flex shrink-0 text-muted" aria-hidden>
        <Icon name="chevronRight" size={14} />
      </span>
    </button>
  );
}

/**
 * 상대 보험사 주장 입력 — h22. 선택 입력이고, 두 칸이 다 차야 [비교하기]가 열린다.
 * 한쪽만 적으면 나머지는 100에서 빼서 자동으로 채운다.
 */
function OpponentClaimForm({ onSubmit }: { onSubmit: (ratio: Ratio) => void }) {
  const [mine, setMine] = useState('');
  const [opponent, setOpponent] = useState('');
  const [skipped, setSkipped] = useState(false);

  if (skipped) return null;

  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  const m = num(mine);
  const o = num(opponent);
  const ok = m !== null && o !== null && m >= 0 && o >= 0 && m + o === 100;

  /* 한쪽을 적으면 반대쪽을 채워 준다 */
  const fill = (which: 'mine' | 'opponent', value: string) => {
    const n = Number(value);
    const valid = value.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 100;
    if (which === 'mine') {
      setMine(value);
      if (valid) setOpponent(String(100 - n));
    } else {
      setOpponent(value);
      if (valid) setMine(String(100 - n));
    }
  };

  const cell =
    'tnum box-border h-11 w-16 rounded-md border border-line bg-surface px-3 text-center text-[15px] text-ink focus-visible:border-brand';

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line-2 bg-bg-3 p-4">
      <p className="text-[13.5px] leading-[1.6] text-ink-3">
        상대 보험사가 말한 비율이 있나요? 있으면 우리 판정과 나란히 비교해 드릴게요. 건너뛰어도
        돼요.
      </p>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) onSubmit({ mine: m, opponent: o });
        }}
      >
        <label className="flex items-center gap-1 text-[13.5px] text-muted">
          나
          <input
            inputMode="numeric"
            aria-label="상대 보험사가 말한 내 과실"
            value={mine}
            onChange={(e) => fill('mine', e.target.value)}
            className={cell}
          />
        </label>
        <span className="text-muted" aria-hidden>
          :
        </span>
        <label className="flex items-center gap-1 text-[13.5px] text-muted">
          상대
          <input
            inputMode="numeric"
            aria-label="상대 보험사가 말한 상대 과실"
            value={opponent}
            onChange={(e) => fill('opponent', e.target.value)}
            className={cell}
          />
        </label>
        <Button type="submit" size="sm" disabled={!ok}>
          비교하기
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setSkipped(true)}>
          없어요 · 건너뛸게요
        </Button>
      </form>
      <p className="text-[12.5px] leading-[1.5] text-muted">
        합이 100이 되게 적어 주세요. 한쪽만 적으면 나머지는 자동으로 채워져요. 두 칸이 다 차면
        [비교하기]가 열려요.
      </p>
    </div>
  );
}
