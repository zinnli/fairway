import type { ChatMessage } from '@/domain/message';

/**
 * 대화는 추가만, 삭제 없음 (00 문서 6절).
 * 화면 h12~h37은 다른 화면이 아니라 이 로그가 한 칸씩 늘어난 상태다.
 *
 * 예외는 진행 중인 카드 하나뿐이다. 업로드 퍼센트는 카드를 새로 쌓지 않고
 * 그 자리에서 숫자만 바꾼다 — 쌓으면 스크롤이 초당 몇 번씩 튄다.
 */
export interface ChatState {
  messages: ChatMessage[];
}

export type ChatAction =
  | { type: 'reset'; messages: ChatMessage[] }
  | { type: 'append'; message: ChatMessage }
  | { type: 'progress'; id: string; percent: number }
  /** 진행 중이던 카드를 끝난 모양으로 갈아 끼운다 (업로드 완료·분석 종료).
   *  지우는 게 아니라 그 자리를 바꾸는 것이라 "추가만" 원칙과 어긋나지 않는다 */
  | { type: 'settle'; message: ChatMessage };

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

    case 'settle':
      return {
        messages: state.messages.map((m) => (m.id === action.message.id ? action.message : m)),
      };
  }
}
