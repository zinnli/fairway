import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { VideoRef } from '@/domain/case';
import { durationLabel, mb } from '@/lib/format';

/**
 * F01 영상 뷰어 — 첨부 카드를 누르면 열린다.
 * 영상은 브라우저 안에만 있다(objectUrl). 시연 데이터처럼 파일이 없는 사건은
 * 안내만 보여 준다 — 없는 화면을 있는 척하지 않는다.
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
        (video.objectUrl ? (
          <video
            src={video.objectUrl}
            controls
            preload="metadata"
            className="w-full rounded-md bg-ink"
          />
        ) : (
          <p className="rounded-md bg-bg-3 px-4 py-6 text-center text-[13.5px] leading-[1.6] text-muted">
            이 사건의 영상 파일은 이 브라우저에 없어요.
            <br />
            영상은 올린 브라우저 안에서만 보관됩니다.
          </p>
        ))}
    </Dialog>
  );
}
