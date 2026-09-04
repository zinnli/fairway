import { Link } from 'react-router';
import { APP_NAME } from '@/config';
import { BrandMark } from '@/components/ui/BrandMark';
import { buttonClass } from '@/components/ui/Button';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Icon } from '@/components/ui/Icon';
import { RatioBar } from '@/components/ui/RatioBar';
import { formatRatio, type Ratio } from '@/domain/verdict';

/**
 * H01 S0 첫 화면 (PC) · M01 첫 화면 (모바일).
 * 두 시안은 본문 구성이 서로 달라(3단계 띠 ↔ 글머리 3줄) 머리글·고지만 공유하고 본문을 갈라 놓았다.
 *
 * 카드에 보이는 숫자는 시연용 예시다. 실제 판정이 아니므로 store를 타지 않는다.
 */

const VERDICT: Ratio = { mine: 20, opponent: 80 };

/** 인정기준 도표 번호는 미확정이라 이름만 쓴다 (00 문서 5절) */
const CHART_NAME = '인정기준 도표 — 신호기 있는 교차로 · 신호위반';
const PRECEDENT_NO = '심의사례 2019-018856';

const STEPS = [
  { icon: 'video', title: '영상 올리기', desc: '블랙박스가 사실을 말해요' },
  {
    icon: 'scale',
    title: '근거와 함께 판정',
    desc: '인정기준 도표(기본 비율 표)와 심의사례를 나란히 봐요',
  },
  { icon: 'send', title: '서류 만들어 발송', desc: '경위서와 반박의견서까지' },
] as const;

const POINTS = [
  { strong: '영상이 사실을 말해요', rest: '블랙박스에서 신호·속도를 읽어요' },
  {
    strong: '숫자마다 근거',
    rest: '인정기준 도표(기본 비율 표)와 뒤집힌 심의사례를 같이 보여요',
  },
  { strong: '서류까지', rest: '경위서와 반박의견서를 만들어 보내요' },
] as const;

function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 px-4 sm:h-16 sm:px-12">
      <BrandMark className="flex-1" />

      {/* 모바일은 글자 링크, PC는 테두리 버튼. 터치 영역은 양쪽 다 44 이상 */}
      <Link
        to="/login"
        className="box-border inline-flex min-h-11 items-center justify-center rounded-md px-2 text-[13.5px] font-medium text-ink transition-colors hover:bg-bg-2 sm:border sm:border-line sm:bg-surface sm:px-5 sm:text-[14px] sm:font-semibold sm:hover:border-brand-line sm:hover:bg-bg sm:active:bg-brand-tint"
      >
        로그인
      </Link>
    </header>
  );
}

/* ── PC 1440 시안 (h01) ────────────────────────────────────────── */

function DesktopBody() {
  return (
    <div className="hidden min-h-0 flex-1 flex-col sm:flex">
      <div className="flex flex-1 items-center gap-18 px-24 pb-24">
        <div className="flex min-w-0 flex-initial basis-134 flex-col items-start gap-6">
          <span className="box-border rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2">
            교통사고 과실비율 AI 비서
          </span>
          <h1 className="text-[40px] leading-[1.25] font-bold tracking-[-1px] text-ink">
            사고 났을 때,
            <br />
            내 편에서 따져 주는 AI
          </h1>
          <p className="text-[15px] leading-[1.6] text-ink-3">
            과실비율이 10%p만 달라져도 내가 내는 돈이 크게 달라질 수 있어요.
            <br />
            근거 있는 숫자로 다투세요.
          </p>
          <p className="-mt-4 text-[12.5px] leading-[1.5] text-muted">
            과실비율은 사고 책임을 나누는 비율이에요. %p는 그 비율끼리의 차이예요.
          </p>
          {/* 로그인 여부 갈림길(F0)은 /cases의 접근 제어가 맡는다 */}
          <Link to="/cases" className={buttonClass({ size: 'lg' })}>
            사고 접수 시작
            <Icon name="arrowRight" size={15} strokeWidth={2} />
          </Link>
          <p className="-mt-2 text-[12.5px] text-muted">
            손해보험협회 과실비율 인정기준 · 분쟁심의 사례 데이터 기반
          </p>
        </div>

        <div className="flex min-w-0 flex-1 justify-center">
          <div className="flex w-full max-w-135 flex-col gap-3 rounded-lg bg-surface p-6 shadow-[0_6px_20px_rgba(17,20,26,0.09)]">
            <div className="flex items-center gap-2">
              <span className="flex text-brand" aria-hidden>
                <Icon name="shield" size={16} />
              </span>
              <span className="flex-1 text-[12.5px] font-semibold text-ink-3">예상 과실비율</span>
            </div>

            <div
              className="tnum flex items-end gap-3"
              role="img"
              aria-label={`예상 과실비율 ${formatRatio(VERDICT)}`}
            >
              <div>
                <div className="mb-1 text-[12.5px] font-medium text-muted">나</div>
                <div className="text-[40px] leading-[0.95] font-bold tracking-[-0.02em] text-ink">
                  {VERDICT.mine}
                </div>
              </div>
              <div className="pb-1 text-[20px] text-muted" aria-hidden>
                :
              </div>
              <div>
                <div className="mb-1 text-[12.5px] font-medium text-muted">상대</div>
                <div className="text-[40px] leading-[0.95] font-bold tracking-[-0.02em] text-ink">
                  {VERDICT.opponent}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <RatioBar label={`${APP_NAME} 판정`} ratio={VERDICT} emphasis />
            </div>

            <div className="flex flex-col gap-1 border-t border-line-2 pt-3">
              <div className="flex items-center gap-2 py-1 text-[12.5px] text-ink">
                <span className="flex text-muted" aria-hidden>
                  <Icon name="file" size={13} />
                </span>
                <span className="flex-1">{CHART_NAME}</span>
                <span className="flex text-muted" aria-hidden>
                  <Icon name="chevronRight" size={12} />
                </span>
              </div>
              <div className="flex items-center gap-2 py-1 text-[12.5px] text-ink">
                <span className="flex text-muted" aria-hidden>
                  <Icon name="file" size={13} />
                </span>
                <span className="flex-1">{PRECEDENT_NO}</span>
                <span className="flex text-muted" aria-hidden>
                  <Icon name="chevronRight" size={12} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ol className="flex shrink-0 items-center justify-center gap-8 px-12 pb-10">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex items-center gap-8">
            {i > 0 && (
              <span className="flex text-muted" aria-hidden>
                <Icon name="chevronRight" size={16} />
              </span>
            )}
            <span className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand"
                aria-hidden
              >
                <Icon name={step.icon} size={18} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-ink">{step.title}</span>
                <span className="block text-[13.5px] text-muted">{step.desc}</span>
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ── 모바일 375 시안 (m01) ─────────────────────────────────────── */

function MobileBody() {
  return (
    <div className="flex min-h-0 flex-1 flex-col sm:hidden">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 px-4">
        <span className="box-border self-start rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2">
          교통사고 과실비율 AI 비서
        </span>
        <h1 className="text-[26px] leading-[1.3] font-bold tracking-[-0.5px] text-ink">
          사고 났을 때,
          <br />
          내 편에서 따져 주는 AI
        </h1>
        <p className="text-[14px] leading-[1.6] text-ink-3">
          과실비율이 10%p만 달라져도 내가 내는 돈이 크게 달라질 수 있어요. 근거 있는 숫자로
          다투세요.
          <span className="mt-1 block text-[12.5px] leading-[1.5] text-muted">
            과실비율은 사고 책임을 나누는 비율이에요. %p는 그 비율끼리의 차이예요.
          </span>
        </p>

        <div className="mt-1 flex flex-col gap-2 rounded-lg border border-line-2 bg-surface p-4 shadow-[0_4px_12px_rgba(17,20,26,0.06)]">
          <span className="text-[12px] font-semibold text-muted">예상 과실비율</span>
          <p
            className="tnum text-[26px] font-bold tracking-[-0.02em] text-ink"
            aria-label={formatRatio(VERDICT)}
          >
            나 {VERDICT.mine} <span className="font-normal text-muted">:</span> 상대{' '}
            {VERDICT.opponent}
          </p>
          <RatioBar label={`${APP_NAME} 판정`} ratio={VERDICT} emphasis />
        </div>

        <ul className="mt-1 flex flex-col gap-2">
          {POINTS.map((point) => (
            <li
              key={point.strong}
              className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-ink-3"
            >
              {/* 색점은 간격이 아니라 부품 규격이라 4배수 예외 */}
              <span
                className="mt-1 h-[5px] w-[5px] shrink-0 rounded-full bg-brand"
                aria-hidden
              />
              <span>
                <span className="font-semibold text-ink">{point.strong}</span> — {point.rest}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 px-4 pb-2">
        <Link to="/cases" className={buttonClass({ size: 'lg', className: 'w-full' })}>
          사고 접수 시작
        </Link>
        <p className="mt-2 text-center text-[12.5px] text-muted">
          손해보험협회 과실비율 인정기준 · 분쟁심의 사례 데이터 기반
        </p>
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-3">
      <Header />
      <MobileBody />
      <DesktopBody />
      {/* 규칙 0.2 — 화면당 한 번. 두 본문이 공유한다 */}
      <Disclaimer className="shrink-0 px-4 pt-2 pb-4 text-center sm:px-12 sm:pt-0 sm:pb-5" />
    </div>
  );
}
