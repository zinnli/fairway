import type { VideoRef } from '@/domain/case';
import { Icon } from '@/components/ui/Icon';
import { durationLabel, mb } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * 올린 영상 — 오른쪽 정렬. 모바일 280 · PC 360 (m05 / h14).
 * 올라가는 중 → 완료(video)로 같은 자리에서 모양만 바뀐다.
 * 취소·오류는 9/3에 빠져서 실패 모양이 없다 (04 문서 C4).
 *
 * 방향(flex-col·flex-row)은 쓰는 쪽에서 정한다 — cn은 그냥 이어 붙이는 함수라
 * 둘을 같이 주면 어느 쪽이 이길지 CSS 순서에 맡기게 된다.
 */
const CHIP =
  'box-border flex w-70 max-w-full min-w-0 self-end rounded-lg rounded-br-xs px-4 py-2 md:w-90';

/**
 * 업로드가 끝난 영상 (h16). 누르면 영상 뷰어가 열린다 (F01).
 *
 * 재생 표시는 시안에 없지만 붙였다 — 눌러서 볼 수 있다는 걸 아무도 몰랐다는
 * 시연 피드백(9/6)이다. 칩 전체가 여전히 단추이고, 표시는 그 사실을 알리기만 한다.
 */
export function VideoBubble({ video, onOpen }: { video: VideoRef; onOpen: () => void }) {
  const meta = [
    video.durationSec > 0 ? durationLabel(video.durationSec) : null,
    video.sizeLabel ?? mb(video.sizeBytes),
    '업로드 완료',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${video.name} 재생`}
      className={cn(
        CHIP,
        'items-center gap-3 bg-brand-tint text-left transition-colors hover:bg-brand-line',
      )}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white"
        aria-hidden
      >
        <Icon name="play" size={16} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="w-full truncate text-[13.5px] font-semibold text-ink">{video.name}</span>
        <span className="text-[12.5px] text-muted">{meta}</span>
      </span>
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
    <div className={cn(CHIP, 'flex-col gap-2 bg-brand-tint')}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-[13.5px] font-semibold text-ink">{fileName}</span>
        {/* 크기를 아직 모르면(예시 영상을 받아 오는 중) 지어내지 않고 뺀다 */}
        {sizeBytes > 0 && (
          <span className="tnum shrink-0 text-[12.5px] text-muted">
            {mb(sent)} / {mb(sizeBytes)}
          </span>
        )}
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
