import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

/**
 * 입력 바 — h12~h39 전부가 쓴다. 알약 52, 양쪽 버튼 44(모바일 터치 규격 그대로 PC에도 둔다).
 * [+]는 영상 고르기, 오른쪽 원은 보내기. 빈 입력일 때 보내기는 색을 바꿔 잠근다.
 * 파일 선택창 자체는 작업 화면이 들고 있다 — h12의 [영상 올리기] 버튼도 같은 창을 열어야 한다.
 *
 * 여러 줄 입력은 textarea가 스스로 자라게 두지 않는다 — 자라면 대화 열이 밀린다.
 */
export function Composer({
  onSend,
  onPickVideo,
  disabled,
  placeholder = '사고 상황을 설명해 주세요',
}: {
  onSend: (text: string) => void;
  onPickVideo: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !disabled;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-none px-4 pt-3 pb-4 md:px-6">
      <form
        /* 초점은 안쪽 입력칸이 아니라 **알약 전체**에 준다 (00 문서 3-1 입력칸 규칙).
           테두리 없는 투명 input에 3px 링을 그리면 둥근 알약 안에 네모 링이 뜬다 */
        className="flex h-13 min-w-0 flex-1 items-center gap-2 rounded-full border border-line-2 bg-surface px-2 shadow-[0_4px_12px_rgba(17,20,26,0.06)] focus-within:border-brand focus-within:shadow-[0_0_0_3px_var(--color-brand-tint),0_4px_12px_rgba(17,20,26,0.06)]"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <button
          type="button"
          onClick={onPickVideo}
          aria-label="영상 고르기"
          disabled={disabled}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg-2 disabled:text-disabled"
        >
          <Icon name="plus" size={18} />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="메시지 입력"
          /* 초점 표시는 감싼 알약이 맡는다 — theme.css의 입력칸 링을 이 칸에서만 끈다 */
          data-focus="none"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted disabled:text-disabled"
        />
        <button
          type="submit"
          aria-label="보내기"
          disabled={!canSend}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            canSend ? 'bg-brand text-white hover:bg-brand-press' : 'bg-bg-2 text-disabled',
          )}
        >
          <Icon name="arrowUp" size={16} strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}
