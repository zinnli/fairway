import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { SAMPLE_VIDEOS } from '@/config';

/**
 * 예시 영상 고르기 — h12 안내 카드의 [영상 올리기] 옆.
 * 올릴 블랙박스가 없는 사람도 흐름을 끝까지 볼 수 있게 한다 (기능명세 6.3, P0).
 *
 * 목록은 `SAMPLE_VIDEOS`가 정본이다 — 브라우저는 public/ 폴더를 훑어볼 수 없다.
 *
 * 목록은 position:fixed다. 안내 카드가 .chat-scroll(overflow-y:auto) 안에 있어서
 * absolute로 두면 아래가 스크롤 상자에 잘린다 — 사이드바 ⋯ 메뉴와 같은 이유다.
 */

/** 단추 아래 4px — 원래 쓰던 mt-1과 같은 값 */
const GAP = 4;
/** 화면 가장자리에서 8px는 띄운다 */
const INSET = 8;

interface Anchor {
  top: number;
  bottom: number;
  left: number;
  viewportH: number;
}

export function SampleVideoPicker({
  onPick,
  loading,
}: {
  onPick: (file: string) => void;
  /** 고른 영상을 받아 오는 중 */
  loading?: boolean;
}) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [flipped, setFlipped] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const open = anchor !== null;

  /* 아래로 열면 화면 밖으로 나가는 경우 위로 뒤집는다.
     paint 전에 도는 훅이라 위치가 한 번 튀어 보이지 않는다 */
  useLayoutEffect(() => {
    if (!anchor || flipped) return;
    const el = listRef.current;
    if (el && el.getBoundingClientRect().bottom > anchor.viewportH - INSET) setFlipped(true);
  }, [anchor, flipped]);

  /* 대화를 스크롤하거나 창을 줄이면 목록이 제 단추에서 떨어져 나가므로 닫는다 */
  useEffect(() => {
    if (!anchor) return;
    const close = () => setAnchor(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [anchor]);

  /* 영상이 하나도 등록되지 않았으면 단추 자체를 내지 않는다 */
  if (SAMPLE_VIDEOS.length === 0) return null;

  const openList = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setFlipped(false);
    setAnchor({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      viewportH: window.innerHeight,
    });
  };

  return (
    <div ref={btnRef} className="inline-flex">
      <Button
        size="lg"
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={loading}
        onClick={() => (open ? setAnchor(null) : openList())}
      >
        {loading ? '예시 영상 가져오는 중…' : '샘플 영상 올리기'}
        {!loading && <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} />}
      </Button>

      {anchor && (
        <>
          {/* 바깥을 누르면 닫히도록 투명 클릭 캐처를 깐다 */}
          <button
            type="button"
            aria-label="예시 영상 목록 닫기"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setAnchor(null)}
          />
          <div
            ref={listRef}
            role="menu"
            aria-label="예시 영상"
            style={
              flipped
                ? { bottom: anchor.viewportH - anchor.top + GAP, left: anchor.left }
                : { top: anchor.bottom + GAP, left: anchor.left }
            }
            className="fixed z-20 flex max-h-90 w-72 flex-col overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
          >
            <p className="mb-1 border-b border-line-2 px-4 py-2 text-[12px] leading-[1.35] text-muted">
              올릴 영상이 없으면 골라서 써 보세요
            </p>
            {SAMPLE_VIDEOS.map((file) => (
              <button
                key={file}
                type="button"
                role="menuitem"
                title={file}
                onClick={() => {
                  setAnchor(null);
                  onPick(file);
                }}
                className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left hover:bg-bg"
              >
                <span className="flex shrink-0 text-muted" aria-hidden>
                  <Icon name="video" size={16} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{file}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
