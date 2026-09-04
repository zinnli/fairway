import { AiMessage, AiNote } from './AiMessage';

/**
 * 분석 중 — h16. 9/3 축소로 단계 시각화와 [분석 멈추기]가 빠졌다 (04 문서 C6).
 * 남은 것은 로딩 표시 하나뿐이다. 카드를 새로 쌓지 않고 이 자리에서 끝난 모양으로 바뀐다.
 */
export function AnalyzingCard({ done }: { done?: boolean }) {
  return (
    <AiMessage className="gap-2">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        {done ? '영상을 다 봤어요' : '영상을 분석하고 있어요'}
        {!done && <Dots />}
      </p>
      {!done && <AiNote>보통 1~2분 걸려요. 끝나면 알려 드릴게요.</AiNote>}
    </AiMessage>
  );
}

/** 점 세 개가 차례로 깜빡인다. 8px 점은 부품 규격이라 4배수 예외 */
function Dots() {
  return (
    <span className="flex items-center gap-1" aria-label="분석 중">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="anim-blink h-1.5 w-1.5 rounded-full bg-brand"
          style={{ animationDelay: `${i * 160}ms` }}
          aria-hidden
        />
      ))}
    </span>
  );
}
