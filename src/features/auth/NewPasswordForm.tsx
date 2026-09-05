import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { isApiError, service } from '@/api';

/**
 * 메일 링크로 돌아와 새 비밀번호를 정한다 — 명세 A-8.
 *
 * 시안에 이 화면이 없다. 길을 새로 내면 라우트가 6개가 되므로
 * **로그인 길에 `?reset=<토큰>`으로 얹는다.** 메일 링크는 이 주소를 가리키면 된다:
 *   {FRONT_BASE_URL}/login?reset={token}
 *
 * 토큰은 30분 · 1회용이다. 만료되면 서버가 RESET_TOKEN_INVALID(410)와 함께
 * "비밀번호 찾기를 다시 시작해 주세요"를 준다 — 그 문구를 그대로 보여 준다.
 */
export function NewPasswordForm({ token, onDone }: { token: string; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      setDone(await service.resetPassword({ token, password, passwordConfirm: confirm }));
    } catch (err) {
      setError(
        isApiError(err)
          ? (err.fields?.password ?? err.fields?.passwordConfirm ?? err.body.message)
          : '연결이 끊겼어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[15px] leading-[1.6] text-ink">{done}</p>
        <Button size="lg" onClick={onDone}>
          로그인하러 가기
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" noValidate>
      <Field
        label="새 비밀번호"
        type="password"
        autoComplete="new-password"
        placeholder="8자 이상, 숫자 포함"
        value={password}
        error={error}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Field
        label="새 비밀번호 확인"
        type="password"
        autoComplete="new-password"
        placeholder="한 번 더 입력해 주세요"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <Button type="submit" size="lg" disabled={saving || password.length === 0}>
        {saving ? '바꾸는 중…' : '비밀번호 바꾸기'}
      </Button>
    </form>
  );
}
