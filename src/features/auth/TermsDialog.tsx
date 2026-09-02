import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { TERMS, type TermKey } from './terms';

/** 필수 배지 — 의미색은 점·글자·가는 선으로만 (11_DesignSystem.html) */
function RequiredBadge() {
  return (
    <span className="box-border inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-sand-text">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sand" aria-hidden />
      필수
    </span>
  );
}

/**
 * P-6 약관·개인정보 팝업 — h40.
 * 동의 3종이 이 부품 하나를 돌려쓴다. 읽기 전용이고, 동의는 가입 화면의 체크박스가 맡는다.
 */
export function TermsDialog({ term, onClose }: { term: TermKey | null; onClose: () => void }) {
  const doc = term ? TERMS[term] : null;

  return (
    <Dialog
      open={doc !== null}
      onClose={onClose}
      title={doc?.title ?? ''}
      badge={<RequiredBadge />}
      width={640}
      footer={
        <>
          <p className="min-w-0 flex-1 text-[12.5px] text-muted">
            읽기만 하는 창이에요. 동의는 가입 화면에서 체크해요.
          </p>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {doc?.summary && (
          <p className="rounded-md bg-brand-tint px-4 py-3 text-[13.5px] leading-[1.6] text-ink">
            <b className="font-semibold">쉽게 말하면</b> — {doc.summary}
          </p>
        )}
        {doc?.sections.map((section) => (
          <p key={section.heading} className="text-[15px] leading-[1.8] text-ink">
            <b className="font-semibold">{section.heading}</b>
            <br />
            {section.body}
          </p>
        ))}
        {doc?.sections.length === 0 && (
          <p className="text-[15px] leading-[1.8] text-muted">
            문구가 아직 준비되지 않았어요. 법무 검토를 거쳐 넣습니다.
          </p>
        )}
        <p className="text-[12.5px] leading-[1.6] text-muted">
          이 글은 시안용 예시예요. 실제 문구는 법무 검토를 거쳐 넣습니다.
        </p>
      </div>
    </Dialog>
  );
}
