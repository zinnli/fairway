import { Button } from '@/components/ui/Button';
import { APP_NAME, SAMPLE_VIDEO, VIDEO_LIMITS } from '@/config';
import { AiMessage, AiNote, AiText } from './AiMessage';

/**
 * 접수 안내 — h12. 사건을 만들면 제일 먼저 붙는 카드다.
 * [영상 올리기]는 입력 바의 [+]와 같은 일을 한다. 둘 다 같은 파일 선택창을 연다.
 * [예시 영상으로 해보기]는 올릴 영상이 없는 사람을 위한 길이다 — 고른 뒤는 완전히 같다.
 */
export function GuideCard({
  onPickVideo,
  onPickSample,
}: {
  onPickVideo: () => void;
  onPickSample: () => void;
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
      {/* 좁은 폭에서 두 단추가 겹치지 않게 접힌다 */}
      <div className="mt-1 flex flex-wrap gap-2">
        <Button size="lg" onClick={onPickVideo}>
          영상 올리기
        </Button>
        {/* 파일이 준비되지 않았으면 config에서 null로 두고 단추를 숨긴다 */}
        {SAMPLE_VIDEO && (
          <Button size="lg" variant="secondary" onClick={onPickSample}>
            예시 영상으로 해보기
          </Button>
        )}
      </div>
    </AiMessage>
  );
}
