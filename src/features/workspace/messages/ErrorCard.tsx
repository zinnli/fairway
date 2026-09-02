import { Button } from '@/components/ui/Button';
import type { ErrorCode } from '@/domain/message';
import { AiMessage, AiText } from './AiMessage';

/**
 * 오류 — 규칙 0.7. 무엇이 안 됐는지 + 어떻게 하면 되는지 + [다시] 셋이 늘 같이 온다.
 * 업로드 실패는 h15·f02, 분석 실패는 h17이다. 분석 쪽만 제목 줄이 붙는다.
 */
export function ErrorCard({
  code,
  hint,
  onRetryAnalyze,
  onPickVideo,
}: {
  code: ErrorCode;
  hint: string;
  onRetryAnalyze: () => void;
  onPickVideo: () => void;
}) {
  const isAnalyze = code === 'analyze/failed';

  return (
    <AiMessage className="gap-3">
      {isAnalyze && <p className="text-[15px] font-semibold text-ink">영상을 분석하지 못했어요</p>}
      <AiText>{hint}</AiText>
      <div className="flex flex-wrap gap-2">
        {isAnalyze ? (
          <>
            <Button size="lg" onClick={onRetryAnalyze}>
              다시 시도
            </Button>
            <Button size="lg" variant="secondary" onClick={onPickVideo}>
              다른 영상 올리기
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={onPickVideo}>
            다시 올리기
          </Button>
        )}
      </div>
    </AiMessage>
  );
}
