import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { isApiError, service } from '@/api';
import { useSessionStore } from '@/store/sessionStore';
import { NewPasswordForm } from '@/features/auth/NewPasswordForm';
import { PasswordResetDialog } from '@/features/auth/PasswordResetDialog';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { AuthCard } from '@/features/auth/AuthCard';
import { zodResolver } from '@/lib/zodResolver';

/**
 * S1 로그인 — h02(기본) · h03(오류) · m02.
 * 두 화면은 같은 폼의 두 상태다. 오류가 나면 카드가 바뀌는 게 아니라 문구 한 줄이 붙는다.
 *
 * 형식은 여기서 보고, 자격은 서버가 본다 (명세 A-2).
 * 서버는 이메일 없음과 비밀번호 틀림을 구분하지 않는다 — 계정이 있는지 알려 주지 않으려고.
 * 오류 문구도 서버가 완성 문장으로 주므로 화면에서 새로 만들지 않는다.
 */

const schema = z.object({
  email: z.email('이메일 형식이 맞지 않아요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이에요.'),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useSessionStore((s) => s.signIn);
  /* 서버가 준 문구. 어느 칸 아래에 붙일지도 서버가 fields로 알려 준다 */
  const [failed, setFailed] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  /* 메일 링크로 돌아오면 같은 길에서 새 비밀번호를 정한다 (A-8) — 라우트를 늘리지 않는다 */
  const [params, setParams] = useSearchParams();
  const resetToken = params.get('reset');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  /* 가드에 막혀 왔다면 로그인한 뒤 원래 가려던 곳으로 돌려보낸다 */
  const from = (location.state as { from?: string } | null)?.from ?? '/cases';

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFailed(null);
    try {
      signIn(await service.login(email, password));
      navigate(from, { replace: true });
    } catch (e) {
      setFailed(
        isApiError(e)
          ? (e.fields?.password ?? e.body.message)
          : '연결이 끊겼어요. 잠시 후 다시 시도해 주세요.',
      );
    }
  });

  if (resetToken) {
    return (
      <AuthCard title="새 비밀번호 정하기">
        <NewPasswordForm
          token={resetToken}
          onDone={() => {
            params.delete('reset');
            setParams(params, { replace: true });
          }}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard title="로그인">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="flex flex-col gap-1">
          {/* 비밀번호 칸은 안내 문구 대신 가린 글자 모양을 보여 준다 (h02·m02) */}
          <Field
            label="비밀번호"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={errors.password?.message ?? failed}
            {...register('password')}
          />
          {/* 터치 영역 44 확보를 위해 링크를 감싼 상자를 키운다 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex min-h-11 items-center rounded-md px-2 text-[13.5px] font-medium text-brand hover:bg-bg-2 sm:min-h-8"
            >
              비밀번호를 잊었어요
            </button>
          </div>
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? '확인하는 중…' : '로그인'}
        </Button>
      </form>
      <PasswordResetDialog open={resetOpen} onClose={() => setResetOpen(false)} />

      <p className="text-center text-[13.5px] text-ink-3">
        계정이 없어요 →{' '}
        <Link to="/signup" className="font-medium text-brand hover:underline">
          회원가입
        </Link>
      </p>
    </AuthCard>
  );
}
