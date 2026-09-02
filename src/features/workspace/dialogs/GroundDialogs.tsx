import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { HistoryEntry } from '@/domain/case';
import type { Precedent, Verdict } from '@/domain/verdict';
import { formatRatio } from '@/domain/verdict';

/** 팝업 본문 한 줄 — 이름/값 */
function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12.5px] font-medium text-muted">{label}</p>
      <div className="text-[14px] leading-[1.6] text-ink">{children}</div>
    </div>
  );
}

/** P-2 인정기준 도표 — h38. 번호는 미확정이라 있을 때만 보여 준다 */
export function ChartDialog({
  open,
  verdict,
  onClose,
}: {
  open: boolean;
  verdict: Verdict | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open && verdict !== null}
      onClose={onClose}
      title="인정기준 도표"
      footer={
        <Button variant="secondary" className="ml-auto" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {verdict && (
        <div className="flex flex-col gap-5">
          <p className="text-[15px] leading-[1.6] text-ink">
            {verdict.chartNo && <span className="tnum">{verdict.chartNo} · </span>}
            {verdict.chartName}
          </p>
          <p className="text-[13.5px] leading-[1.6] text-muted">
            사고 유형별 기본 비율을 정해 둔 표예요.
          </p>
          <Line label="기본 과실">{formatRatio(verdict.baseRatio)}</Line>
          <Line label="더하는 사정">
            {verdict.adjustments.length === 0 ? (
              '해당 없음'
            ) : (
              <ul className="flex flex-col gap-1">
                {verdict.adjustments.map((a) => (
                  <li key={a.label}>
                    {a.label} <span className="tnum">{a.delta > 0 ? `+${a.delta}` : a.delta}%p</span>
                  </li>
                ))}
              </ul>
            )}
          </Line>
          <p className="text-[12.5px] text-muted">출처: 손해보험협회 과실비율 인정기준</p>
        </div>
      )}
    </Dialog>
  );
}

/** P-1 유사 심의사례 — h37 */
export function PrecedentDialog({
  open,
  precedent,
  onClose,
}: {
  open: boolean;
  precedent: Precedent | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open && precedent !== null}
      onClose={onClose}
      title={precedent ? `심의사례 ${precedent.no}` : '심의사례'}
      width={480}
      badge={
        precedent && (
          <span className="tnum rounded-full border border-line px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2">
            일치도 {Math.round(precedent.match * 100)}%
          </span>
        )
      }
      footer={
        <Button variant="secondary" className="ml-auto" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {precedent && (
        <div className="flex flex-col gap-5">
          <Line label="사고 개요">{precedent.summary}</Line>
          {precedent.isReversed && (
            <Line label="심의 결과">
              뒤집힘 — 블랙박스로 상대 신호위반이 입증되어 일방과실이 인정된 사례예요.
            </Line>
          )}
          <p className="text-[12.5px] leading-[1.5] text-muted">
            이 사례가 내 사건과 다르다면 어디가 다른지 알려 주세요. 그 사례를 빼고 다시 판정해
            드려요.
          </p>
        </div>
      )}
    </Dialog>
  );
}

/** P-4 변경 이력 — h39 */
export function HistoryDialog({
  open,
  entries,
  onClose,
}: {
  open: boolean;
  entries: HistoryEntry[];
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="변경 이력"
      width={480}
      footer={
        <Button variant="secondary" className="ml-auto" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {entries.length === 0 ? (
        <p className="text-[13.5px] text-muted">아직 바뀐 내용이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-col gap-1">
              <span className="tnum text-[12.5px] text-muted">
                {new Date(e.at).toLocaleString('ko-KR')}
              </span>
              <span className="text-[14px] leading-[1.6] text-ink">{e.text}</span>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

/** F-04 분쟁심의 절차 안내 */
const PROCESS = [
  {
    title: '보험사 회신 검토',
    body: '반박의견서에 대한 회신이 오면 채팅에 붙여넣어 주세요. 받아들여졌는지 함께 따져 봐요.',
  },
  {
    title: '내 보험사에 심의 청구 요청',
    body: '받아들여지지 않으면 내 보험사에 분쟁심의 청구를 요청할 수 있어요. 심의는 보험사끼리 진행돼요 — 개인이 직접 신청하는 곳은 아니에요.',
  },
  {
    title: '심의 결과 확인',
    body: '심의 결과에 따라 과실비율이 조정돼요. 우리가 찾은 유사 사례처럼 뒤집히는 경우도 있어요.',
  },
];

export function ProcessDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="과실비율 분쟁심의, 이렇게 진행돼요"
      footer={
        <Button variant="secondary" className="ml-auto" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <ol className="flex flex-col gap-4">
          {PROCESS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[12.5px] font-semibold text-brand-press">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-[14px] font-semibold text-ink">{step.title}</p>
                <p className="text-[13.5px] leading-[1.6] text-ink-3">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[12.5px] leading-[1.5] text-muted">
          보험사에 심의 청구를 요청하는 서식은 준비 중이에요. 지금은 절차 안내만 제공해요.
        </p>
      </div>
    </Dialog>
  );
}
