import type { ChatMessage } from '@/domain/message';

/**
 * 대화는 추가만, 삭제 없음 (00 문서 6절).
 * 화면 h12~h39는 다른 화면이 아니라 이 로그가 한 칸씩 늘어난 상태다.
 *
 * 예외는 진행 중인 카드 하나뿐이다. 업로드 퍼센트와 분석 단계는 카드를 새로 쌓지 않고
 * 그 자리에서 숫자만 바꾼다 — 쌓으면 스크롤이 초당 몇 번씩 튄다.
 */
export interface ChatState {
  messages: ChatMessage[];
}

export type ChatAction =
  | { type: 'reset'; messages: ChatMessage[] }
  | { type: 'append'; message: ChatMessage }
  | { type: 'progress'; id: string; percent: number }
  | { type: 'step'; id: string; label: string };

export const emptyChat: ChatState = { messages: [] };

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'reset':
      return { messages: action.messages };

    case 'append':
      return { messages: [...state.messages, action.message] };

    case 'progress':
      return {
        messages: state.messages.map((m) =>
          m.id === action.id && m.kind === 'uploading' ? { ...m, progress: action.percent } : m,
        ),
      };

    case 'step':
      return {
        messages: state.messages.map((m) =>
          m.id === action.id && m.kind === 'analyzing' ? { ...m, step: action.label } : m,
        ),
      };
  }
}
