import { SelectChip } from '@/components/ui/Chip';
import type { Chip, ChatMessage } from '@/domain/message';
import type { FactKey } from '@/domain/fact';
import { AiMessage, AiNote, AiText } from './AiMessage';

/**
 * 부족한 정보 되묻기 — h20. 칩으로 고르거나 그냥 글로 답해도 된다.
 * [잘 모르겠어요]를 고르면 그 항목은 [확인 필요]로 남고 판정의 쟁점이 된다.
 */
export function QuestionCard({
  message,
  onAnswer,
}: {
  message: Extract<ChatMessage, { kind: 'question' }>;
  onAnswer: (field: FactKey, chip: Chip) => void;
}) {
  return (
    <AiMessage className="gap-3">
      <AiText>{message.text}</AiText>
      <div className="flex flex-wrap gap-2">
        {message.chips.map((chip) => (
          <SelectChip key={chip.label} onClick={() => onAnswer(message.field, chip)}>
            {chip.label}
          </SelectChip>
        ))}
      </div>
      <AiNote>직접 입력할 수도 있어요</AiNote>
    </AiMessage>
  );
}
