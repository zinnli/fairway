import { useState } from 'react';
import { APP_NAME } from '@/config';
import { Button } from '@/components/ui/Button';
import { SelectChip, SourceChip } from '@/components/ui/Chip';
import { StatusBadge } from '@/components/ui/Badge';
import { RatioBar } from '@/components/ui/RatioBar';
import { StepDots } from '@/components/ui/StepDots';
import { StageIcon } from '@/components/ui/StageIcon';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Dialog } from '@/components/ui/Dialog';
import { Icon, type IconName } from '@/components/ui/Icon';
import { STAGE_LABELS, type CaseStatus, type StageState } from '@/domain/case';
import { factCountLabel, type Fact } from '@/domain/fact';

const ICONS: IconName[] = [
  'shield', 'chevronRight', 'chevronDown', 'chevronUp', 'plus', 'close', 'check', 'checkSmall',
  'arrowUp', 'arrowDown', 'arrowRight', 'menu', 'pencil', 'pencilAlt', 'play', 'download',
  'paperclip', 'file', 'logout', 'retry', 'video', 'send', 'scale', 'clock', 'checkCircle', 'more',
];

const STATUSES: CaseStatus[] = ['접수중', '분석중', '확인 필요', '판정 완료', '재판정중', '발송 완료', '종결'];
const STATES: StageState[] = ['대기', '진행중', '완료'];

const SAMPLE_FACTS: Fact[] = [
  { key: 'myLane', value: '1차로 직진', source: 'video' },
  { key: 'opponentEntry', value: '좌측에서 진입', source: 'video' },
  { key: 'opponentSignal', value: '적색', source: 'video' },
  { key: 'mySpeed', value: '약 45km/h', source: 'video' },
  { key: 'impactPoint', value: '우측 앞펜더', source: 'statement' },
  { key: 'stopLineTiming', value: null, source: 'unknown', isDisputed: true },
];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-bold">{title}</h2>
        {note && <p className="text-[12.5px] text-muted">{note}</p>}
      </div>
      <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">{children}</div>
    </section>
  );
}

export function DesignSystemPage() {
  const [chip, setChip] = useState('우측 앞펜더');
  const [open, setOpen] = useState(false);

  return (
    <main className="mx-auto flex max-w-[1080px] flex-col gap-12 px-10 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-[12.5px] font-medium tracking-[0.6px] text-muted">
          {APP_NAME} · DESIGN SYSTEM 이식 확인
        </p>
        <h1 className="text-[36px] font-bold tracking-[-0.9px]">
          토큰과 부품이 원본과 같은지 눈으로 확인하는 페이지
        </h1>
        <p className="max-w-[680px] text-[15px] leading-relaxed text-ink-3">
          11_DesignSystem.html을 옆에 띄워 두고 비교하세요. 어긋나면 컴포넌트가 아니라 토큰을 고칩니다.
        </p>
      </header>

      <Section title="1. 색 토큰" note="정보 글자는 muted까지. disabled(#98A2B3)는 잠금 전용입니다.">
        <div className="flex flex-wrap gap-2">
          {[
            ['brand', 'bg-brand'], ['brand-press', 'bg-brand-press'], ['brand-tint', 'bg-brand-tint'],
            ['brand-line', 'bg-brand-line'], ['ink', 'bg-ink'], ['ink-2', 'bg-ink-2'], ['ink-3', 'bg-ink-3'],
            ['muted', 'bg-muted'], ['disabled', 'bg-disabled'], ['line', 'bg-line'], ['line-2', 'bg-line-2'],
            ['bg', 'bg-bg'], ['bg-2', 'bg-bg-2'], ['bg-3', 'bg-bg-3'], ['track', 'bg-track'],
            ['teal', 'bg-teal'], ['sand', 'bg-sand'], ['danger', 'bg-danger'],
          ].map(([name, cls]) => (
            <div key={name} className="flex w-30 flex-col gap-1">
              <div className={`h-16 rounded-md border border-line-2 ${cls}`} />
              <span className="text-[12.5px] font-medium">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="2. 버튼" note="잠금은 opacity가 아니라 색 교체입니다. 호버·눌림을 직접 눌러 확인하세요.">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="lg">시작하기</Button>
          <Button size="md">경위서 만들기</Button>
          <Button size="sm">다시 시도</Button>
          <Button variant="secondary" size="md">건너뛰기</Button>
          <Button variant="secondary" size="sm">전문 보기</Button>
          <Button variant="icon" aria-label="더보기"><Icon name="more" /></Button>
          <Button variant="link"><Icon name="logout" size={13} />나가기</Button>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <Button disabled>보내기</Button>
          <Button variant="secondary" disabled>PDF 받기</Button>
          <Button disabled lockedReason="경위서를 만들면 열려요">반박의견서 만들기</Button>
        </div>
      </Section>

      <Section title="3. 칩과 배지">
        <div className="flex flex-wrap gap-2">
          <SourceChip source="video" />
          <SourceChip source="statement" />
          <SourceChip source="unknown" />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => <StatusBadge key={s} status={s} />)}
        </div>
        <div className="flex flex-wrap gap-2">
          {['앞범퍼', '우측 앞펜더', '우측 뒷문', '뒷범퍼', '잘 모르겠어요'].map((label) => (
            <SelectChip key={label} selected={chip === label} onClick={() => setChip(label)}>
              {label}
            </SelectChip>
          ))}
        </div>
      </Section>

      <Section title="4. 비율 막대" note="빨강·초록 금지. 잉크 숫자 + 보라 듀오톤.">
        <div className="flex items-end gap-3 tnum">
          <div>
            <div className="mb-1 text-[12.5px] font-medium text-muted">나</div>
            <div className="text-[56px] font-bold leading-[0.95] tracking-[-0.02em]">0</div>
          </div>
          <div className="pb-1 text-[26px] tracking-[-0.02em] text-muted">:</div>
          <div>
            <div className="mb-1 text-[12.5px] font-medium text-muted">상대</div>
            <div className="text-[56px] font-bold leading-[0.95] tracking-[-0.02em]">100</div>
          </div>
        </div>
        <div className="flex max-w-[560px] flex-col gap-2">
          <RatioBar label="상대 보험사 주장" ratio={{ mine: 30, opponent: 70 }} />
          <RatioBar label={`${APP_NAME} 판정`} ratio={{ mine: 0, opponent: 100 }} emphasis />
        </div>
        <Disclaimer />
      </Section>

      <Section title="5. 진행 단계와 사실 카운트">
        <div className="flex flex-wrap gap-6">
          {STATES.map((state) => (
            <div key={state} className="flex items-center gap-2">
              <StageIcon state={state} />
              <span className="text-[13.5px] text-ink-3">{state}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {STAGE_LABELS.map(({ key, label }, i) => (
            <div key={key} className="flex items-center gap-2">
              <StageIcon state={i === 0 ? '완료' : i === 1 ? '진행중' : '대기'} />
              <span className="text-[13.5px]">{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[13.5px] text-ink-3">{factCountLabel(SAMPLE_FACTS)}</p>
        <StepDots step={3} steps={6} label="접수 3단계 중 3단계" />
      </Section>

      <Section title="6. 아이콘" note="10_디자인.html에서 추출한 26종. 20×20 · 1.5px · currentColor.">
        <div className="flex flex-wrap gap-2">
          {ICONS.map((name) => (
            <div key={name} className="flex h-22 w-22 flex-col items-center justify-center gap-2 rounded-md border border-line-2">
              <Icon name={name} />
              <span className="text-[11px] text-muted">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="7. 팝업" note="네이티브 dialog — 포커스 트랩·Esc·스크롤 잠금이 기본으로 옵니다.">
        <div>
          <Button variant="secondary" onClick={() => setOpen(true)}>도표 팝업 열기</Button>
        </div>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="인정기준 도표"
          footer={<Button onClick={() => setOpen(false)}>확인</Button>}
        >
          <p className="text-[15px] leading-relaxed">
            신호기에 의해 교통정리가 이루어지고 있는 교차로에서의 사고. 도표 번호는 AI 담당이 확정하면
            <code className="mx-1 rounded bg-bg-2 px-1 text-[13px]">chartNo</code>
            한 필드만 채우면 다섯 화면에 동시에 들어갑니다.
          </p>
        </Dialog>
      </Section>
    </main>
  );
}
