import type { VideoRef } from '@/domain/case';
import { durationLabel, mb } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * 올린 영상 — 오른쪽 정렬. 모바일 280 · PC 360 (m05 / h14).
 * 올라가는 중 → 완료(video)로 같은 자리에서 모양만 바뀐다.
 * 취소·오류는 9/3에 빠져서 실패 모양이 없다 (04 문서 C4).
 */
const CHIP =
  'box-border flex w-70 max-w-full min-w-0 flex-col self-end rounded-lg rounded-br-xs px-4 py-2 md:w-90';

/** 업로드가 끝난 영상 (h16). 누르면 영상 뷰어가 열린다 (F01) */
export function VideoBubble({ video, onOpen }: { video: VideoRef; onOpen: () => void }) {
  const meta = [
    video.durationSec > 0 ? durationLabel(video.durationSec) : null,
    video.sizeLabel ?? mb(video.sizeBytes),
    '업로드 완료',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button type="button" onClick={onOpen} className={cn(CHIP, 'gap-1 bg-brand-tint text-left')}>
      <span className="w-full truncate text-[13.5px] font-semibold text-ink">{video.name}</span>
      <span className="text-[12.5px] text-muted">{meta}</span>
    </button>
  );
}

/** 올라가는 중 — h14 */
export function UploadingCard({
  fileName,
  sizeBytes,
  progress,
}: {
  fileName: string;
  sizeBytes: number;
  progress: number;
}) {
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
      <p className="text-[12.5px] text-muted">올리는 중…</p>
    </div>
  );
}
