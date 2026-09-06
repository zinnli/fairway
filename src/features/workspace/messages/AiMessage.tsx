import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { splitQuestionCount } from '@/lib/format';

/**
 * AI가 하는 말의 공통 껍데기 — 말풍선이 아니라 방패 아이콘 + 왼쪽 여백 28이다.
 * 폭은 560이 정본(00 문서 6절). 좁아지면 줄지만 넓어지지는 않는다.
 */
export function AiMessage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative flex w-full max-w-140 min-w-0 flex-col gap-2 pl-7', className)}>
      <span className="absolute top-0.5 left-0 flex text-brand" aria-hidden>
        <Icon name="shield" size={16} />
      </span>
      {children}
    </div>
  );
}

/**
 * AI 본문 한 줄.
 *
 * 되물음 끝에 붙는 순번("1/2")은 질문이 아니라 진행 표시라서, 본문에서 떼어
 * **정보 글자**로 돌린다 — muted 13.5px · tnum (시안 h20b가 같은 값으로 그려 뒀다).
 * 폭이 고정되는 tnum이라 1/2와 2/2가 같은 자리에 선다.
 *
 * `whitespace-pre-line` — 서버가 보내는 글에는 이미 줄바꿈이 들어 있다
 * (분석 요약의 문장 단위 줄, 심의사례 목록의 항목별 줄). 그대로 <p>에 넣으면
 * 브라우저가 전부 한 줄로 붙여 버린다. 이 한 줄이 줄바꿈만 살리고
 * 잇단 공백은 그대로 접어 준다.
 *
 * 서버가 줄바꿈을 빠뜨려 보내도 여기서 손대지 않는다 — 온 그대로 보여 준다.
 * 문장마다 끊는 것은 판정 카드의 결론 줄 하나뿐이다(VerdictCard).
 */
export function AiText({ children }: { children: ReactNode }) {
  const body = typeof children === 'string' ? splitQuestionCount(children) : null;

  return (
    <p className="text-[15px] leading-[1.6] whitespace-pre-line text-ink">
      {body ? body.body : children}
      {body?.count && (
        <span className="tnum ml-1 text-[13.5px] font-normal text-muted">{body.count}</span>
      )}
    </p>
  );
}

/** 본문 아래 붙는 작은 설명 — 정보 글자라 muted까지만 */
export function AiNote({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] leading-[1.5] text-muted">{children}</p>;
}
