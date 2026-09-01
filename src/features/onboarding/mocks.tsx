import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatRatio, type Ratio } from '@/domain/verdict';

/**
 * 온보딩 그림 4종 — h06 · h06b · h07의 보라 상자 안에 들어가는 장식.
 * 그림 자리는 전부 장식이라 실제 데이터를 타지 않는다. 문구는 시안 그대로다.
 *
 * ★ 모바일 시안(m03)은 1장만 그려져 있고 그림 구성이 PC와 다르다.
 *   2·3장 모바일 그림이 없어 PC 그림을 폭만 줄여 함께 쓴다.
 * ★ 시안은 장마다 그림 폭이 420·400·380으로 다르다. 넘길 때마다 크기가 흔들려 420으로 통일했다.
 */

const EXAMPLE_RATIO: Ratio = { mine: 0, opponent: 100 };

/** 흰 알약 배지 — 건너뛰기 · 예시 · 버전 표시가 같은 규격을 쓴다 */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="box-border inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2">
      {children}
    </span>
  );
}

export function ChatMock() {
  return (
    <div className="flex w-full max-w-105 flex-col gap-2">
      <p className="self-end rounded-lg rounded-br-xs border border-line-2 bg-surface px-3 py-2 text-[13.5px] text-ink">
        어제 교차로에서 직진하는데 옆에서 오토바이가 박았어요.
      </p>
      <p className="box-border flex items-center gap-1 self-end rounded-lg border border-line-2 bg-surface px-4 py-2 text-[13.5px] text-ink">
        <span className="flex text-brand" aria-hidden>
          <Icon name="video" size={14} />
        </span>
        <span className="font-semibold">blackbox_0822.mp4</span>
        <span className="text-muted">42초</span>
      </p>
      <div className="mt-2 flex items-center gap-2 rounded-full border border-line-2 bg-surface py-1 pr-1 pl-2 shadow-[0_4px_12px_rgba(17,20,26,0.06)]">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-2 bg-brand-tint text-brand"
          aria-hidden
        >
          <Icon name="plus" size={16} strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 text-[15px] text-muted">사고 상황을 설명해 주세요</span>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white"
          aria-hidden
        >
          <Icon name="arrowUp" size={14} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

export function VerdictMock() {
  return (
    <div className="flex w-full max-w-105 flex-col gap-2 rounded-lg bg-surface p-4 shadow-[0_4px_12px_rgba(17,20,26,0.06)]">
      <p className="text-[12px] font-medium tracking-[0.6px] text-muted">예상 과실비율</p>
      <p
        className="tnum flex items-baseline gap-1"
        role="img"
        aria-label={`예상 과실비율 ${formatRatio(EXAMPLE_RATIO)}`}
      >
        <span className="text-[12px] font-medium text-muted">나</span>
        <span className="text-[26px] leading-none font-bold tracking-[-0.02em] text-ink">
          {EXAMPLE_RATIO.mine}
        </span>
        <span className="text-[15px] text-muted">:</span>
        <span className="text-[12px] font-medium text-muted">상대</span>
        <span className="text-[26px] leading-none font-bold tracking-[-0.02em] text-ink">
          {EXAMPLE_RATIO.opponent}
        </span>
      </p>
      <div className="flex flex-col gap-1 rounded-md border border-brand-line p-2">
        <p className="flex items-center gap-1">
          <span className="min-w-0 flex-1 text-[12.5px] text-ink">
            인정기준 도표 — 신호기 있는 교차로 · 신호위반
          </span>
          <span className="text-[12px] font-medium text-brand">보기</span>
        </p>
        <p className="flex items-center gap-1">
          <span className="min-w-0 flex-1 text-[12.5px] text-ink">
            심의사례 2019-018856 · 신호위반 직진 충돌
          </span>
          <span className="text-[12px] text-muted">95% 일치</span>
        </p>
      </div>
    </div>
  );
}

export function StatementMock() {
  return (
    <div className="flex w-full max-w-105 flex-col gap-2 rounded-lg bg-surface p-4 shadow-[0_4px_12px_rgba(17,20,26,0.06)]">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink">사건경위서</span>
        <Pill>두 번째 버전 · 2장</Pill>
      </div>
      <p className="text-[12px] leading-[1.7] text-ink-3">
        <b className="font-semibold text-ink">1. 사고 일시 및 장소</b> — 2026년 8월 22일 14시경,
        서울시 강남구 논현사거리…
        <br />
        <b className="font-semibold text-ink">2. 사고 경위</b> — 본인은 2차로에서 정상 신호에 따라
        직진 중…
      </p>
      <div className="flex gap-1">
        <span className="box-border flex h-8 items-center rounded-md border border-line bg-surface px-3 text-[12.5px] font-semibold text-ink">
          전문 보기
        </span>
        <span className="box-border flex h-8 items-center rounded-md bg-brand px-3 text-[12.5px] font-semibold text-white">
          PDF 받기
        </span>
      </div>
    </div>
  );
}

