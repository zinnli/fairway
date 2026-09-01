import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { AgreementRow } from '@/features/auth/AgreementRow';
import { AuthCard } from '@/features/auth/AuthCard';
import { TermsDialog } from '@/features/auth/TermsDialog';
import { TERM_ORDER, type TermKey } from '@/features/auth/terms';
import { zodResolver } from '@/lib/zodResolver';

/**
 * S2 회원가입 — h04(기본) · h05(오류) · h40(약관 팝업).
 * h40은 라우트가 아니라 이 화면 안의 모달이다.
 *
 * 가입 성공 = 바로 로그인 상태로 사건 목록 도착. 다시 로그인시키지 않는다 (03 유저플로우 F0).
 * 처음 온 사람이므로 목록 위에 온보딩(h06~h07)을 얹은 상태로 보낸다. 01 화면색인이 묶어 둔
 * "첫 화면 → 로그인·회원가입 → 온보딩" 순서다. 로그인으로 다시 오는 사람에겐 띄우지 않는다.
 * replace로 가서 뒤로가기가 가입 폼으로 돌아가지 않게 한다.
 * 이메일 중복은 서버가 판정하는데 Api 계약(src/api/types.ts)에 인증이 아직 없다.
 * 자리는 duplicateEmail로 잡아 뒀고, 인증이 붙으면 그 값만 켜면 h05가 그대로 나온다.
 *
 * 가입 버튼은 입력 세 칸과 필수 동의 세 개가 모두 찼을 때만 열린다.
 * 잠금은 opacity가 아니라 색 교체이고(Button), 왜 잠겼는지는 버튼 아래 한 줄로 말한다.
 */

const schema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해 주세요.')
      .pipe(z.email('이메일 형식이 맞지 않아요.')),
    password: z
      .string()
      .min(1, '비밀번호를 입력해 주세요.')
      .min(8, '비밀번호가 짧아요. 8자 이상, 숫자를 섞어 다시 입력해 주세요.')
      .regex(/[0-9]/, '비밀번호가 짧아요. 8자 이상, 숫자를 섞어 다시 입력해 주세요.'),
    passwordConfirm: z.string().min(1, '비밀번호를 한 번 더 입력해 주세요.'),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ['passwordConfirm'],
    message: '비밀번호가 서로 달라요. 한 번 더 확인해 주세요.',
  });

type Form = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState<Record<TermKey, boolean>>({
    service: false,
    privacy: false,
    video: false,
  });
  const [openTerm, setOpenTerm] = useState<TermKey | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm<Form>({ resolver: zodResolver(schema), mode: 'onTouched' });

  /** 채워졌는지·동의했는지는 저장하지 않고 매번 파생한다 */
  const allAgreed = TERM_ORDER.every((key) => agreed[key]);
  const canSubmit = isValid && allAgreed;

  const onSubmit = handleSubmit(() => {
    setDuplicateEmail(null);
    navigate('/onboarding', { replace: true });
  });

  return (
    <AuthCard title="회원가입">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={
            duplicateEmail ? '이미 가입된 이메일이에요. 로그인해 주세요.' : errors.email?.message
          }
          {...register('email')}
        />
        <Field
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상, 숫자 포함"
          error={errors.password?.message}
          {...register('password')}
        />
        <Field
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          placeholder="한 번 더 입력"
          error={errors.passwordConfirm?.message}
          {...register('passwordConfirm')}
        />

        <div className="flex flex-col gap-1">
          {TERM_ORDER.map((key) => (
            <AgreementRow
              key={key}
              term={key}
              checked={agreed[key]}
              onToggle={() => setAgreed((prev) => ({ ...prev, [key]: !prev[key] }))}
              onOpen={() => setOpenTerm(key)}
            />
          ))}
          <p className="pl-7 text-[12.5px] leading-[1.5] text-muted">
            영상은 과실비율 분석에만 쓰고, 사건을 지우면 함께 지워져요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" disabled={!canSubmit}>
            가입하기
          </Button>
          {!canSubmit && (
            <p className="text-center text-[12.5px] leading-[1.5] text-muted">
              {isValid
                ? '필수 3가지에 모두 체크하면 가입할 수 있어요.'
                : '이메일과 비밀번호를 모두 채우면 가입할 수 있어요.'}
            </p>
          )}
        </div>

        {duplicateEmail && (
          <Button
            variant="secondary"
            onClick={() => navigate('/login', { state: { email: getValues('email') } })}
          >
            이 이메일로 로그인하기
          </Button>
        )}
      </form>

      <p className="text-center text-[12px] text-muted">
        가입하면 바로 로그인돼요. 다시 로그인할 필요 없어요.
      </p>
      <p className="text-center text-[13.5px] text-ink-3">
        이미 계정이 있어요 →{' '}
        <Link to="/login" className="font-medium text-brand hover:underline">
          로그인
        </Link>
      </p>

      <TermsDialog term={openTerm} onClose={() => setOpenTerm(null)} />
    </AuthCard>
  );
}
