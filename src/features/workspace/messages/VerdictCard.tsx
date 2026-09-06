import { Dots } from '@/components/ui/Dots';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { RatioBar } from '@/components/ui/RatioBar';
import { APP_NAME, DISCLAIMER } from '@/config';
import { formatRatio, type Precedent, type Verdict } from '@/domain/verdict';
import { breakSentences } from '@/lib/format';
import { MessageCard } from './MessageCard';

/**
 * 상대 주장과 견준 한 줄 — 시안 h21의 초록 화살표 줄.
 * 문장은 서버가 만든다. 화면은 어느 쪽이 낮은지만 보고 색과 화살표를 고른다.
 */
function ClaimNote({ verdict }: { verdict: Verdict }) {
  const claim = verdict.opponentClaim;
  /* 주장이 없으면 견줄 것도 없다 — 화살표 없이 정보 글자로만 청한다 */
  if (!claim) {
    return <p className="text-[12.5px] leading-[1.5] text-muted">{verdict.opponentClaimNote}</p>;
  }

  const lower = verdict.ratio.mine < claim.mine;
  const higher = verdict.ratio.mine > claim.mine;
  const tone = lower ? 'text-teal-text' : higher ? 'text-sand-text' : 'text-muted';

  return (
    <p className={`flex items-start gap-1 text-[13.5px] leading-[1.5] font-semibold ${tone}`}>
      {(lower || higher) && (
        <span className="mt-1 flex shrink-0" aria-hidden>
          <Icon name={lower ? 'arrowDown' : 'arrowUp'} size={13} strokeWidth={2} />
        </span>
      )}
      <span className="min-w-0">{verdict.opponentClaimNote}</span>
    </p>
  );
}

/**
 * 판정 — h21. 61화면의 기준 화면이다.
 *
 * 9/3에 파란 강조 박스를 전부 뺐다가(04 문서 C5) 9/6에 **비교 막대와 견주는 한 줄만**
 * 되살렸다(04 문서 R2). 여전히 없는 것은 "근거 N건 · 쟁점 N건" 알약 · 일치도(%) · 쟁점 줄이다.
 *
 * 그래서 남는 것은 비율 · 한 줄 결론 · 비교 막대 · 근거 목록 넷이다.
 * 도표 번호는 서버가 chartName 앞머리에 실어 보낸다 — 화면이 따로 그리지 않는다.
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
    <MessageCard>
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

      {/*
        한 줄 결론 — 서버가 문장 둘을 붙여 보낼 때가 있다("…일방과실이에요. 내 차가…").
        온점 뒤에서 끊어 문장마다 한 줄로 둔다. 이미 끊겨 왔으면 손대지 않는다.
        판정 카드에서만 하는 일이다 — 대화의 다른 말은 온 그대로 보여 준다.
      */}
      <p className="text-[15px] leading-[1.6] whitespace-pre-line text-ink">
        {breakSentences(verdict.conclusion)}
      </p>

      {/*
        비율 막대 — 시안 h21·h23. 상대 보험사가 주장하는 비율을 사용자가 대화에서
        말해 줬을 때만 위 칸이 선다(`opponentClaim`이 null이면 서버가 모른다는 뜻).
        비교할 것이 없으면 우리 판정 막대 하나만 남고, 아래 줄이 알려 달라고 청한다.

        연보라(brand-line) 8px = 상대 주장 · 진보라(brand) 10px = 우리 판정.
        높이 8/10은 간격이 아니라 부품 규격이라 4배수 예외다.

        견주는 한 줄(`opponentClaimNote`)은 **서버가 만들어 준다** — 화면이 %p를
        세지 않는다. 내 과실이 낮으면 초록·↓, 높으면 모래빛·↑, 나머지는 그냥 글이다.
      */}
      <div className="flex flex-col gap-3">
        {verdict.opponentClaim && (
          <RatioBar label="상대 보험사 주장" ratio={verdict.opponentClaim} />
        )}
        <RatioBar label={`${APP_NAME} 판정`} ratio={ratio} emphasis />
        {verdict.opponentClaimNote && <ClaimNote verdict={verdict} />}
      </div>

      <div className="h-px bg-line" />

      <div className="flex flex-col gap-1">
        <p className="text-[12px] font-semibold text-muted">근거</p>

        {/*
          도표 줄과 심의사례 줄은 시안에서 **같은 상자**다
          (gap 8 · padding 8/8 · margin 0 -8 · radius 8). -mx-2가 빠져 있어서
          이 줄만 8px 오른쪽으로 밀려 있었다. 높이(min-h-11)와 오른쪽 여백도 맞춘다.
          누를 수는 없다 — 도표 팝업(h38)은 9/3에 빠졌다.
        */}
        <div className="-mx-2 flex min-h-11 items-start gap-2 px-2 py-2 text-[13.5px]">
          {/* 두 줄일 때 아이콘이 첫 줄에 서게 한다 — h-5가 13.5px 글자의 줄 높이다 */}
          <span className="flex h-5 shrink-0 items-center text-muted" aria-hidden>
            <Icon name="file" size={14} />
          </span>
          <span className="min-w-0 flex-1">
            {/* 번호는 서버가 이름 앞에 붙여 준다 — 화면이 따로 그리지 않는다 (9/6) */}
            <span className="block text-ink">인정기준 도표 — {verdict.chartName}</span>
            {verdict.chartNote && (
              <span className="block text-[12.5px] leading-[1.5] text-muted">
                {verdict.chartNote}
              </span>
            )}
          </span>
          {/* 심의사례 줄의 chevron 자리를 비워 둬야 글자 폭이 같아진다 */}
          <span className="invisible flex h-5 shrink-0 items-center" aria-hidden>
            <Icon name="chevronRight" size={14} />
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
        이 단추는 상설 창구가 아니라 **다음 걸음 안내**다 — "판정이 끝났으니 경위서를
        만드세요". 걸음을 디디고 나면 역할이 끝나므로 내지 않는다.

        막다른 곳에 두지 않는다: 여기서 보는 `statementExists`는 곧
        `lastOf('statementDraft')`, 즉 **대화에 초안 카드가 있느냐**다. 이 단추가
        사라지는 순간은 [전문 보기]·[다시 쓰기]·[PDF 받기]를 단 h26 카드가
        대화에 붙어 있는 순간이고, 현황판의 서류 줄도 늘 열려 있다.
        대화는 앞으로만 가므로(00 문서 6절) 할 일은 맨 아래에 있어야 한다.

        만드는 중 표시는 남긴다 — 누른 뒤 카드가 붙기 전까지가 비면 눌린 줄 모른다.
      */}
      {!statementExists && (
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
              사건경위서 만들기
              <span aria-hidden>→</span>
            </>
          )}
        </Button>
      )}

      {withDisclaimer && <p className="text-[12.5px] leading-[1.5] text-muted">{DISCLAIMER}</p>}
    </MessageCard>
  );
}
