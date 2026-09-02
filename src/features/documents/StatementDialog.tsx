import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { DISCLAIMER } from '@/config';
import type { SectionSource, Statement } from '@/domain/document';
import { versionLabel } from '@/lib/document';
import { cn } from '@/lib/cn';

/**
 * S5 사건경위서 전문 — h30. 가운데 모달(폭 760 · 본문 여백 32/40).
 * 서랍이 아니다 — 서랍은 좁은 화면의 사이드바·현황판만 쓴다.
 *
 * PDF는 html2canvas로 만들지 않는다 — 한글이 이미지로 뭉개진다.
 * 인쇄 CSS + window.print()를 쓰고, 인쇄용 본문은 작업 화면이 따로 들고 있다.
 */
const DOT: Record<SectionSource['source'], string | null> = {
  video: 'bg-brand',
  statement: 'bg-teal',
  unknown: 'bg-sand',
  ref: null, // 도표·심의사례는 출처 태그가 아니라 색점을 찍지 않는다
};

function monthDay(iso: string) {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 머리글의 알약 배지 */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="box-border shrink-0 rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2">
      {children}
    </span>
  );
}

export function StatementDialog({
  open,
  doc,
  unknownNote,
  onClose,
  onRewrite,
  onPrint,
  rewriting,
}: {
  open: boolean;
  doc: Statement | null;
  /** 아직 확인되지 않은 항목이 있으면 본문에 단정해서 쓰지 않았다고 말해 준다 (h30) */
  unknownNote: string | null;
  onClose: () => void;
  onRewrite: (note: string) => void;
  onPrint: () => void;
  rewriting?: boolean;
}) {
  return (
    <Dialog
      open={open && doc !== null}
      onClose={onClose}
      title="사건경위서"
      width={760}
      bodyClass="px-10 py-8"
      icon={
        <span className="flex shrink-0 text-muted" aria-hidden>
          <Icon name="file" size={20} />
        </span>
      }
      badge={
        doc && (
          <span className="flex min-w-0 shrink items-center gap-1 overflow-hidden">
            <Pill>{versionLabel(doc.version)}</Pill>
            <Pill>{monthDay(doc.updatedAt)}</Pill>
            <Pill>대화 {doc.reflectedMessageCount}건 반영</Pill>
          </span>
        )
      }
      footer={
        doc && (
          <div className="flex w-full flex-col gap-2">
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('note');
                if (input instanceof HTMLInputElement && input.value.trim()) {
                  onRewrite(input.value.trim());
                  input.value = '';
                }
              }}
            >
              <input
                name="note"
                aria-label="어디를 고칠까요"
                placeholder="예: 2번을 더 간단하게"
                disabled={rewriting}
                className="box-border h-11 min-w-0 flex-1 rounded-md border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-muted focus-visible:border-brand disabled:bg-bg-2 disabled:text-disabled"
              />
              <Button type="submit" variant="secondary" disabled={rewriting}>
                {rewriting ? '다시 쓰는 중…' : '다시 쓰기'}
              </Button>
              <Button onClick={onPrint}>
                <Icon name="file" size={15} />
                PDF 받기
              </Button>
            </form>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="tnum text-[12.5px] text-muted">1 / {doc.pageCount}쪽</span>
              <span className="text-[12.5px] leading-[1.5] text-muted">{DISCLAIMER}</span>
            </div>
          </div>
        )
      }
    >
      {doc && (
        <div className="flex flex-col gap-3">
          <p className="rounded-md bg-bg-3 px-4 py-3 text-[13.5px] leading-[1.6] text-ink-3">
            채팅에서 나눈 대화 {doc.reflectedMessageCount}건과 영상 분석 결과를 바탕으로 쓴{' '}
            <span className="font-semibold text-ink">{versionLabel(doc.version)}</span>이에요.
          </p>

          {unknownNote && (
            <p className="flex items-start gap-2 rounded-md border border-line bg-surface px-4 py-3 text-[13.5px] leading-[1.6] text-sand-text">
              {/* 6px 색점 — 부품 규격이라 4배수 예외 */}
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sand" aria-hidden />
              <span className="min-w-0">{unknownNote}</span>
            </p>
          )}

          {doc.sections.map((section, i) => (
            <section key={section.title} className="flex flex-col">
              <h3 className="text-[15px] font-semibold text-ink">
                {i + 1}. {section.title}
              </h3>
              <p className="text-[15px] leading-[1.8] text-ink">{section.body}</p>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-[12px] leading-[1.5] text-muted">
                근거:
                {section.sources.map((source, j) => (
                  <span key={source.label} className="inline-flex items-center gap-1">
                    {j > 0 && <span aria-hidden>·</span>}
                    {DOT[source.source] && (
                      <span
                        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[source.source])}
                        aria-hidden
                      />
                    )}
                    {source.label}
                  </span>
                ))}
              </p>
            </section>
          ))}
        </div>
      )}
    </Dialog>
  );
}

/** 인쇄용 본문 — 화면에는 안 보이고 인쇄할 때만 나온다 */
export function PrintableStatement({ doc, title }: { doc: Statement; title: string }) {
  return (
    <article className="hidden print:block">
      <h1>사건경위서</h1>
      <p>{title}</p>
      {doc.sections.map((section, i) => (
        <section key={section.title}>
          <h2>
            {i + 1}. {section.title}
          </h2>
          <p>{section.body}</p>
        </section>
      ))}
      <p>{DISCLAIMER}</p>
    </article>
  );
}
