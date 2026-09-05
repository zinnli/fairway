import { Dots } from '@/components/ui/Dots';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { DISCLAIMER } from '@/config';
import { formatRatio, type Precedent, type Verdict } from '@/domain/verdict';

/**
 * 판정 — h21. 61화면의 기준 화면이다.
 * 9/3 축소로 파란 강조 박스가 전부 빠졌다 (04 문서 C5):
 * "근거 N건 · 쟁점 N건" 알약 · 일치도(%) · 상대 주장 비교 · 차이 %p 안내 · 쟁점 줄.
 *
 * 남는 것은 비율 · 한 줄 결론 · 근거 목록뿐이다.
 * 도표 번호는 미확정이라 chartNo가 null이면 번호 칸을 아예 숨긴다.
 */
export function VerdictCard({
  verdict,
  onOpenPrecedent,
  onCreateStatement,
  statementExists,
  statementBusy,
  withDisclaimer,
}: {
  verdict: Verdict;
  onOpenPrecedent: (precedent: Precedent) => void;
  /** 이미 있으면 만들지 않고 연다 (작업 화면이 갈라 준다) */
  onCreateStatement: () => void;
  /** 경위서가 이미 있는가. 대화는 앞으로만 가서 이 카드가 계속 남아 있다 */
  statementExists?: boolean;
  /** 지금 만들거나 다시 쓰는 중 */
  statementBusy?: boolean;
  withDisclaimer?: boolean;
}) {
  const { ratio } = verdict;

  return (
    <div className="flex w-full max-w-140 min-w-0 flex-col gap-3 rounded-lg bg-surface p-4 shadow-[0_4px_12px_rgba(17,20,26,0.06)] md:p-6">
      <div className="flex items-center gap-2">
        <span className="flex shrink-0 text-brand" aria-hidden>
          <Icon name="shield" size={16} />
        </span>
        <p className="min-w-0 flex-1 text-[13.5px] font-semibold text-ink">예상 과실비율</p>
      </div>

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

      <p className="text-[15px] leading-[1.6] text-ink">{verdict.conclusion}</p>

      <div className="h-px bg-line" />

      <div className="flex flex-col gap-1">
        <p className="text-[12px] font-semibold text-muted">근거</p>

        {/* 도표는 글 한 줄로만 남는다 — 팝업(h38)은 9/3에 빠졌다 */}
        <div className="flex items-center gap-2 px-2 py-2 text-[13.5px]">
          <span className="flex shrink-0 text-muted" aria-hidden>
            <Icon name="file" size={14} />
          </span>
          <span className="min-w-0 flex-1 text-ink">
            인정기준 도표
            {verdict.chartNo && <span className="tnum"> {verdict.chartNo}</span>} — {verdict.chartName}
          </span>
        </div>

        {verdict.precedents.map((p) => (
          <button
            key={p.no}
            type="button"
            onClick={() => onOpenPrecedent(p)}
            className="-mx-2 flex min-h-11 items-center gap-2 rounded-sm px-2 py-2 text-left text-[13.5px] hover:bg-bg"
          >
            <span className="flex shrink-0 text-muted" aria-hidden>
              <Icon name="file" size={14} />
            </span>
            <span className="min-w-0 flex-1 truncate text-ink">
              심의사례 {p.no} · {p.summary}
            </span>
            <span className="flex shrink-0 text-muted" aria-hidden>
              <Icon name="chevronRight" size={14} />
            </span>
          </button>
        ))}
      </div>

      {/*
        판정 카드는 대화에 그대로 남는다. 경위서를 만든 뒤에도 "만들기"라고 적혀 있으면
        한 장 더 만들어지는 줄 안다 — 이미 있으면 **하는 일 그대로** [보기]로 바꾼다.
        잠긴 회색 단추로 두지 않는 이유: 현황판의 서류 줄도 같은 규칙이다
        ("눌리지 않는 줄을 만들지 않는다"). 누르면 전문이 열리므로 할 일이 남아 있다.
      */}
      <Button
        size="lg"
        className="mt-1 self-start"
        onClick={onCreateStatement}
        disabled={statementBusy}
      >
        {statementBusy ? (
          <>
            사건경위서 만드는 중
            <Dots />
          </>
        ) : (
          <>
            {statementExists ? '사건경위서 보기' : '사건경위서 만들기'}
            <span aria-hidden>→</span>
          </>
        )}
      </Button>

      {withDisclaimer && <p className="text-[12.5px] leading-[1.5] text-muted">{DISCLAIMER}</p>}
    </div>
  );
}
