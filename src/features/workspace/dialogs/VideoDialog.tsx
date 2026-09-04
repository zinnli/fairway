import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { VideoRef } from '@/domain/case';
import { durationLabel, mb } from '@/lib/format';

/**
 * F01 영상 뷰어 — 첨부 카드를 누르면 열린다.
 * 영상은 브라우저 안에만 있다(objectUrl). 시연 데이터처럼 파일이 없는 사건은
 * 안내만 보여 준다 — 없는 화면을 있는 척하지 않는다.
 *
 * 파일이 있어도 브라우저가 못 읽는 형식이 있다 — mp4 안에 든 코덱이 mp4v(MPEG-4 Part 2)나
 * 일부 HEVC면 어느 브라우저도 그림을 못 만든다. 그때 검은 상자를 그대로 두면 고장으로 보여서,
 * 사정을 한 줄로 알리고 분석에는 문제가 없다는 것까지 말해 준다.
 * 미리보기·썸네일·길이는 모두 같은 디코더를 타므로 함께 안 된다.
 */
export function VideoDialog({
  open,
  video,
  onClose,
}: {
  open: boolean;
  video: VideoRef | null;
  onClose: () => void;
}) {
  /* 재생에 실패한 영상의 id. 다른 영상을 열면 다시 시도한다 */
  const [failedId, setFailedId] = useState<string | null>(null);
  const playable = video !== null && video.objectUrl !== undefined && failedId !== video.id;

  const meta = video
    ? [video.durationSec > 0 ? durationLabel(video.durationSec) : null, mb(video.sizeBytes)]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <Dialog
      open={open && video !== null}
      onClose={onClose}
      title={video?.name ?? '영상'}
      width={640}
      badge={video && <span className="shrink-0 text-[12.5px] text-muted">{meta}</span>}
      footer={
        <>
          <p className="min-w-0 flex-1 text-[12.5px] leading-[1.5] text-muted">
            영상은 이 사건 처리에만 쓰이며, 사건을 지우면 함께 지워집니다.
          </p>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </>
      }
    >
      {video &&
        (playable ? (
          <video
            key={video.id}
            src={video.objectUrl}
            controls
            preload="metadata"
            onError={() => setFailedId(video.id)}
            className="w-full rounded-md bg-ink"
          />
        ) : (
          <p className="rounded-md bg-bg-3 px-4 py-6 text-center text-[13.5px] leading-[1.6] text-muted">
            {video.objectUrl ? (
              <>
                이 영상은 브라우저에서 미리 볼 수 없는 형식이에요.
                <br />
                분석에는 문제가 없어요 — 결과는 그대로 나와요.
              </>
            ) : (
              <>
                이 사건의 영상 파일은 이 브라우저에 없어요.
                <br />
                영상은 올린 브라우저 안에서만 보관됩니다.
              </>
            )}
          </p>
        ))}
    </Dialog>
  );
}
