import { Button } from '@/components/ui/Button';
import { SampleVideoPicker } from '@/features/workspace/SampleVideoPicker';

/**
 * [영상 올리기] + [샘플 영상 올리기].
 *
 * 카드에 붙박이가 아니라 **대화의 맨 끝을 따라다니는 부품**이다. 영상을 올리기 전에
 * 이야기부터 하면 안내 카드(h12)와 서버가 단추를 달아 보낸 답(h13)이 겹쳐서
 * 같은 단추가 화면에 둘 이상 서 있었다. 작업 화면이 `uploadCardId`로 자리를 하나만
 * 고르고, 그 카드만 이것을 그린다.
 *
 * 입력 바의 [+]와 같은 일을 한다 — 둘 다 같은 파일 선택창을 연다.
 */
export function UploadActions({
  label = '영상 올리기',
  onPickVideo,
  onPickSample,
  loading,
}: {
  /** 서버가 답에 붙여 준 단추 문구가 있으면 그것을 쓴다 (h13) */
  label?: string;
  onPickVideo: () => void;
  onPickSample: (file: string) => void;
  /** 예시 영상을 받아 오는 중 */
  loading?: boolean;
}) {
  return (
    /* 좁은 폭에서 두 단추가 겹치지 않게 접힌다 */
    <div className="mt-1 flex flex-wrap gap-2">
      <Button size="lg" onClick={onPickVideo}>
        {label}
      </Button>
      <SampleVideoPicker onPick={onPickSample} loading={loading} />
    </div>
  );
}
