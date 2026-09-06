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
  | { type: 'settle'; message: ChatMessage }
  /** 새 버전으로 갈아 끼우고 **맨 아래로 옮긴다** (경위서·반박의견서 다시 쓰기).
   *  서버는 다시 쓰기를 `message.updated`로 보내서(명세 F-4) 카드가 제자리에 머무는데,
   *  그러면 저 위에서 조용히 바뀌어 다시 쓴 티가 안 난다. 카드를 하나 더 만들지 않고
   *  있던 것을 대화 끝으로 옮긴다 — 대화는 앞으로만 가기 때문이다 (00 문서 6절) */
  | { type: 'revise'; message: ChatMessage }
  /** 화면이 잠깐 세워 둔 카드를 치운다 (업로드 중·분석 중).
   *  서버가 만든 진짜 카드가 도착하면 그 자리를 내준다 — 로그에 남는 카드는 지우지 않는다 */
  | { type: 'drop'; id: string }
  /** 더 오래된 쪽을 **앞에** 붙인다 (위로 올려서 보기 · 명세 C-1).
   *  "추가만" 원칙과 어긋나지 않는다 — 지난 대화를 늦게 읽어 왔을 뿐이다 */
  | { type: 'prepend'; messages: ChatMessage[] };

export const emptyChat: ChatState = { messages: [] };

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'reset':
      return { messages: action.messages };

    case 'prepend': {
      /* 이미 들고 있는 카드는 거른다 — 커서가 겹치거나 같은 쪽을 두 번 읽어도 안전하게 */
      const have = new Set(state.messages.map((m) => m.id));
      const older = action.messages.filter((m) => !have.has(m.id));
      return older.length ? { messages: [...older, ...state.messages] } : state;
    }

    case 'append':
      /* 같은 카드가 두 번 오는 일(내가 방금 붙인 글이 이벤트로 되돌아오는 등)은 여기서 막는다.
         화면 쪽 거울로 거르면 같은 틱에 둘이 오면 놓친다 */
      if (state.messages.some((m) => m.id === action.message.id)) return state;
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

    case 'revise':
      return {
        messages: [...state.messages.filter((m) => m.id !== action.message.id), action.message],
      };

    case 'drop':
      return { messages: state.messages.filter((m) => m.id !== action.id) };
  }
}
