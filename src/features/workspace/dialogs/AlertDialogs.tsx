import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { ApiErrorAction } from '@/api';
import type { Rebuttal } from '@/domain/document';

/**
 * P-5 오류 — 무엇이 안 됐는지 + 어떻게 하면 되는지 (규칙 0.7).
 *
 * 문구도 단추도 **서버가 정한다** (명세 §2.3):
 * `title`·`message`는 완성 문장으로 오고, `actions`에 그릴 단추가, `retryable`에
 * [다시 시도]를 낼지가 담겨 온다. 화면에서 문구를 새로 만들지 않는다.
 */
export function ErrorDialog({
  open,
  title,
  hint,
  retryable = true,
  actions = [],
  onClose,
  onRetry,
  onAction,
}: {
  open: boolean;
  title: string;
  hint: string;
  /** 서버가 다시 해 볼 만하다고 한 경우에만 [다시 시도]를 낸다 */
  retryable?: boolean;
  actions?: ApiErrorAction[];
  onClose: () => void;
  onRetry: () => void;
  onAction?: (action: ApiErrorAction) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      width={480}
      footer={
        <>
          <span className="flex-1" />
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          {/* 서버가 지정한 다음 걸음. 예: [사건경위서 먼저 만들기] */}
          {actions.map((action) => (
            <Button key={action.type} onClick={() => onAction?.(action)}>
              {action.label}
            </Button>
          ))}
          {retryable && actions.length === 0 && <Button onClick={onRetry}>다시 시도</Button>}
        </>
      }
    >
      <p className="text-[15px] leading-[1.6] text-ink">{hint}</p>
    </Dialog>
  );
}

/** P-3 발송 확인 — h35. 되돌릴 수 없는 행동이라 한 번 더 묻는다 */
export function SendConfirmDialog({
  open,
  draft,
  sending,
  onBack,
  onSend,
}: {
  open: boolean;
  draft: Rebuttal | null;
  sending?: boolean;
  onBack: () => void;
  onSend: () => void;
}) {
  const attached = draft?.attachments.filter((a) => a.included) ?? [];

  return (
    <Dialog
      open={open && draft !== null}
      onClose={onBack}
      title="이대로 보낼까요?"
      width={480}
      footer={
        <>
          <span className="flex-1" />
          <Button variant="secondary" onClick={onBack}>
            다시 볼게요
          </Button>
          <Button onClick={onSend} disabled={sending}>
            {sending ? '보내는 중…' : '네, 지금 보낼게요'}
          </Button>
        </>
      }
    >
      {draft && (
        <div className="flex flex-col gap-3 text-[14px] leading-[1.6]">
          <p className="flex gap-2">
            <span className="w-14 shrink-0 text-muted">받는이</span>
            <span className="min-w-0 text-ink">{draft.to}</span>
          </p>
          <p className="flex gap-2">
            <span className="w-14 shrink-0 text-muted">제목</span>
            <span className="min-w-0 text-ink">{draft.subject}</span>
          </p>
          <p className="flex gap-2">
            <span className="w-14 shrink-0 text-muted">첨부</span>
            <span className="min-w-0 text-ink">
              {attached.length}개{attached.length > 0 && ` — ${attached.map((a) => a.label).join(' · ')}`}
            </span>
          </p>

          <p className="text-[13.5px] font-medium text-danger">보낸 뒤에는 취소할 수 없어요.</p>
        </div>
      )}
    </Dialog>
  );
}
