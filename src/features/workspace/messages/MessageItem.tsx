import type { ChatMessage } from '@/domain/message';
import { AiMessage, AiText } from './AiMessage';
import { GuideCard } from './GuideCard';
import { UserBubble } from './UserBubble';

/**
 * kind 하나당 카드 하나 (총 15종). 새 kind를 domain/message.ts에 넣으면 여기에도 한 줄 는다.
 * 아직 만들지 않은 종류는 null이다 — 순서대로 채운다.
 */
export interface MessageActions {
  onPickVideo: () => void;
}

export function MessageItem({ message, actions }: { message: ChatMessage; actions: MessageActions }) {
  switch (message.kind) {
    case 'guide':
      return <GuideCard onPickVideo={actions.onPickVideo} />;

    case 'text':
      // 같은 kind가 역할에 따라 말풍선이 되기도, 카드 없는 AI 답변이 되기도 한다
      return message.role === 'user' ? (
        <UserBubble>{message.text}</UserBubble>
      ) : (
        <AiMessage>
          <AiText>{message.text}</AiText>
        </AiMessage>
      );

    case 'choice':
      return <UserBubble>{message.label}</UserBubble>;

    case 'video':
    case 'uploading':
    case 'analyzing':
    case 'error':
    case 'facts':
    case 'question':
    case 'verdict':
    case 'rejudging':
    case 'statementDraft':
    case 'rebuttalDraft':
    case 'sent':
    case 'nextSteps':
      return null;
  }
}
