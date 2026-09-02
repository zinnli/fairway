import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { AuthCard } from '@/features/auth/AuthCard';
import { zodResolver } from '@/lib/zodResolver';

/**
 * S1 로그인 — h02(기본) · h03(오류) · m02.
 * 두 화면은 같은 폼의 두 상태다. 오류가 나면 카드가 바뀌는 게 아니라 문구 한 줄이 붙는다.
 *
 * 자격 검증에는 인증 엔드포인트가 필요한데 Api 계약(src/api/types.ts)에 아직 없다.
 * 기능명세 6.3(심사위원이 주소만 열면 바로 쓸 수 있어야 함)에 따라 로그인 범위가
 * 미확정이라서다. 지금은 형식 검사까지만 하고 사건 목록으로 보낸다.
 */

const schema = z.object({
  email: z.email('이메일 형식이 맞지 않아요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이에요.'),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(() => {
    navigate('/cases');
  });

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
            error={errors.password?.message}
            {...register('password')}
          />
          {/* 터치 영역 44 확보를 위해 링크를 감싼 상자를 키운다 */}
          <div className="flex justify-end">
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center rounded-md px-2 text-[13.5px] font-medium text-brand hover:bg-bg-2 sm:min-h-8"
            >
              비밀번호를 잊었어요
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          로그인
        </Button>
      </form>
      <p className="text-center text-[13.5px] text-ink-3">
        계정이 없어요 →{' '}
        <Link to="/signup" className="font-medium text-brand hover:underline">
          회원가입
        </Link>
      </p>
    </AuthCard>
  );
}
