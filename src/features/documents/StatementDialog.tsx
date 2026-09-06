import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Dots } from '@/components/ui/Dots';
import { Icon } from '@/components/ui/Icon';
import { DISCLAIMER } from '@/config';
import type { Statement } from '@/domain/document';
import { versionLabel } from '@/lib/document';

/**
 * S5 사건경위서 전문 — h30. 가운데 모달(폭 760 · 본문 여백 32/40).
 * 서랍이 아니다 — 서랍은 좁은 화면의 사이드바·현황판만 쓴다.
 *
 * 9/3 축소로 "대화 N건 반영"(C9)과 절마다 붙던 근거 줄(0.3 출처 태그)이 빠졌다.
 * [다시 쓰기]는 9/4에 되살렸다 — 진행 화면(h31)이 없어서 단추 하나로만 알린다.
 *
 * PDF는 html2canvas로 만들지 않는다 — 한글이 이미지로 뭉개진다.
 * 인쇄 CSS + window.print()를 쓰고, 인쇄용 본문은 작업 화면이 따로 들고 있다.
 */
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
  onClose,
  onPrint,
  onRewrite,
  rewriting,
}: {
  open: boolean;
  doc: Statement | null;
  onClose: () => void;
  onPrint: () => void;
  /** 적어 준 요청대로 다시 쓴다. 빈 칸이면 그냥 다시 쓴다 */
  onRewrite: (instruction: string) => void;
  rewriting?: boolean;
}) {
  const [instruction, setInstruction] = useState('');
  /* 보낸 요청은 그 자리에서 지운다 — 같은 요청이 두 번 나가지 않게 */
  const rewrite = () => {
    onRewrite(instruction.trim());
    setInstruction('');
  };

  return (
    <Dialog
      open={open && doc !== null}
      onClose={onClose}
      title="사건경위서"
      width={760}
      bodyClass="px-5 py-6 sm:px-10 sm:py-8"
      icon={
        <span className="flex shrink-0 text-muted" aria-hidden>
          <Icon name="file" size={20} />
        </span>
      }
      badge={
        doc && (
          <span className="flex min-w-0 shrink items-center gap-1 overflow-hidden">
            <Pill>{versionLabel(doc.version)}</Pill>
            {doc.dateLabel && <Pill>{doc.dateLabel}</Pill>}
          </span>
        )
      }
      footer={
        doc && (
          <div className="flex w-full flex-col gap-2">
            {/* 시안 h30 — 고칠 곳을 적어 주면 그대로 다시 쓴다 */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                disabled={rewriting}
                placeholder="예: 2번을 더 간단하게"
                aria-label="다시 쓸 때 반영할 요청"
                className="h-11 min-w-0 flex-1 rounded-md border border-line bg-surface px-4 text-[14px] text-ink placeholder:text-muted focus:outline-none disabled:bg-bg-2 disabled:text-disabled"
              />
              <Button variant="secondary" onClick={rewrite} disabled={rewriting}>
                {rewriting ? (
                  <>
                    다시 쓰는 중
                    <Dots />
                  </>
                ) : (
                  '다시 쓰기'
                )}
              </Button>
              <Button onClick={onPrint} disabled={rewriting}>
                <Icon name="file" size={15} />
                PDF 받기
              </Button>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              {/*
                시안 h30은 `1 / 2쪽`이라고 적어 뒀지만 쪽을 넘기는 장치가 없다 —
                같은 화면의 핸드오프 주석대로 본문은 한 줄기로 이어지고 이 칸만 스크롤한다.
                그래서 `1 /`은 늘 1이고, 없는 조작이 있는 것처럼 읽힌다. 숫자만 남긴다.
                (장수 자체는 서버가 만든 PDF를 센 값이다 — 못 받으면 지어내지 않고 숨긴다)
              */}
              {doc.pageCount > 0 && (
                <span className="tnum text-[12.5px] text-muted">{doc.pageCount}쪽</span>
              )}
              <span className="text-[12.5px] leading-[1.5] text-muted">{DISCLAIMER}</span>
            </div>
          </div>
        )
      }
    >
      {doc && (
        <div className="flex flex-col gap-3">
          <p className="rounded-md bg-bg-3 px-4 py-3 text-[13.5px] leading-[1.6] text-ink-3">
            채팅에서 나눈 이야기와 영상 분석 결과를 바탕으로 쓴{' '}
            <span className="font-semibold text-ink">{versionLabel(doc.version)}</span>이에요.
          </p>

          {doc.sections.map((section, i) => (
            <section key={section.title} className="flex flex-col">
              <h3 className="text-[15px] font-semibold text-ink">
                {i + 1}. {section.title}
              </h3>
              {/* 서버가 문장마다 줄을 바꿔 보낸다 (9/6) — 그 줄바꿈을 살린다 */}
              <p className="text-[15px] leading-[1.8] whitespace-pre-line text-ink">
                {section.body}
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
          {/* 인쇄 화면도 문장별 줄로 나가야 한다 */}
          <p className="whitespace-pre-line">{section.body}</p>
        </section>
      ))}
      <p>{DISCLAIMER}</p>
    </article>
  );
}
