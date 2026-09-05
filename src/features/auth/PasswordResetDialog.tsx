import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { isApiError, service } from '@/api';

/**
 * 비밀번호 재설정 메일 보내기 — 명세 A-7.
 *
 * 시안에 이 화면이 없다. h02의 [비밀번호를 잊었어요] 하나뿐이라
 * 길을 새로 내지 않고 로그인 화면 위에 팝업으로 띄운다.
 *
 * 서버는 **가입되지 않은 주소여도 202로 답한다** — 계정이 있는지 알려 주지 않으려고.
 * 그래서 화면도 "없는 주소예요" 같은 말을 하지 않는다.
 */
export function PasswordResetDialog({
  open,
  defaultEmail,
  onClose,
}: {
  open: boolean;
  defaultEmail?: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setSent(null);
    setError(null);
    onClose();
  };

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      setSent(await service.requestPasswordReset(email.trim()));
    } catch (e) {
      setError(isApiError(e) ? e.body.message : '연결이 끊겼어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="비밀번호를 잊으셨나요?"
      width={480}
      footer={
        <>
          <span className="flex-1" />
          <Button variant="secondary" onClick={close}>
            {sent ? '닫기' : '취소'}
          </Button>
          {!sent && (
            <Button onClick={() => void submit()} disabled={sending || email.trim().length === 0}>
              {sending ? '보내는 중…' : '메일 보내기'}
            </Button>
          )}
        </>
      }
    >
      {sent ? (
        <p className="text-[15px] leading-[1.6] text-ink">{sent}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[14px] leading-[1.6] text-ink-3">
            가입한 이메일로 새 비밀번호를 정하는 링크를 보내 드려요.
          </p>
          <Field
            label="이메일"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={error}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}
    </Dialog>
  );
}
