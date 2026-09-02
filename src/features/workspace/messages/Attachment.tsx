import { Button } from '@/components/ui/Button';
import type { VideoRef } from '@/domain/case';
import { durationLabel, mb } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * 올린 영상 — 오른쪽 정렬. 모바일 280 · PC 360 (m05 / h14).
 * 올라가는 중 → 완료(video) 또는 실패·취소로 같은 자리에서 모양만 바뀐다.
 */
const CHIP =
  'box-border flex w-70 max-w-full min-w-0 flex-col self-end rounded-lg rounded-br-xs px-4 py-2 md:w-90';

/** 업로드가 끝난 영상 (h16) */
export function VideoBubble({ video }: { video: VideoRef }) {
  const meta = [
    video.durationSec > 0 ? durationLabel(video.durationSec) : null,
    mb(video.sizeBytes),
    '업로드 완료',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={cn(CHIP, 'gap-1 bg-brand-tint')}>
      <p className="truncate text-[13.5px] font-semibold text-ink">{video.name}</p>
      <p className="text-[12.5px] text-muted">{meta}</p>
    </div>
  );
}

/** 올라가는 중 · 실패 · 취소 (h14 · h15 · f02) */
export function UploadingCard({
  fileName,
  sizeBytes,
  progress,
  state,
  note,
  onCancel,
}: {
  fileName: string;
  sizeBytes: number;
  progress: number;
  state: 'uploading' | 'failed' | 'canceled';
  note?: string;
  onCancel: () => void;
}) {
  if (state !== 'uploading') {
    return (
      <div className={cn(CHIP, 'gap-1', state === 'failed' ? 'bg-danger-fill' : 'bg-brand-tint')}>
        <p className="truncate text-[13.5px] font-semibold text-ink">
          {state === 'failed' ? `${fileName} · ${mb(sizeBytes)}` : fileName}
        </p>
        <p
          className={cn(
            'text-[12.5px]',
            state === 'failed' ? 'font-medium text-danger' : 'text-muted',
          )}
        >
          {note ?? (state === 'failed' ? '올리지 못했어요' : '업로드를 취소했어요')}
        </p>
      </div>
    );
  }

  const sent = Math.round((sizeBytes * Math.min(100, progress)) / 100);

  return (
    <div className={cn(CHIP, 'gap-2 bg-brand-tint')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-[13.5px] font-semibold text-ink">{fileName}</span>
        <span className="tnum shrink-0 text-[12.5px] text-muted">
          {mb(sent)} / {mb(sizeBytes)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line-2">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="flex min-h-11 items-center justify-between gap-2">
        <span className="text-[12.5px] text-muted">올리는 중…</span>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          업로드 취소
        </Button>
      </div>
    </div>
  );
}
