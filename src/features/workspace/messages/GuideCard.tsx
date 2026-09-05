import { APP_NAME, VIDEO_LIMITS } from '@/config';
import { AiMessage, AiNote, AiText } from './AiMessage';
import { UploadActions } from './UploadActions';

/**
 * 접수 안내 — h12. 사건을 만들면 제일 먼저 붙는 카드다.
 *
 * 단추는 이 카드의 것이 아니다 — 영상을 올리기 전까지 **대화의 맨 끝**에만 선다.
 * 여기서 이야기부터 시작하면 이 카드는 위로 밀려나고 단추만 아래로 따라간다.
 * 자리를 고르는 것은 작업 화면(`uploadCardId`)이고, 이 카드는 받은 대로 그린다.
 */
export function GuideCard({
  onPickVideo,
  onPickSample,
  sampleLoading,
  showUpload,
}: {
  onPickVideo: () => void;
  onPickSample: (file: string) => void;
  sampleLoading?: boolean;
  /** 이 카드가 지금 단추를 맡은 자리인가 */
  showUpload?: boolean;
}) {
  return (
    <AiMessage>
      <AiText>
        안녕하세요, {APP_NAME}예요. 사고 상황을 말로 설명하고, 블랙박스 영상을 올려 주세요. 둘이
        모이면 분석이 자동으로 시작돼요.
      </AiText>
      <AiNote>
        영상은 이 사건 처리에만 쓰이며, 사건을 지우면 함께 지워집니다. {VIDEO_LIMITS.acceptLabel}
      </AiNote>
      {showUpload && (
        <UploadActions
          onPickVideo={onPickVideo}
          onPickSample={onPickSample}
          loading={sampleLoading}
        />
      )}
    </AiMessage>
  );
}
