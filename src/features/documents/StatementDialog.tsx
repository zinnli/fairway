import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Dots } from '@/components/ui/Dots';
import { Icon } from '@/components/ui/Icon';
import { DISCLAIMER } from '@/config';
import type { Statement } from '@/domain/document';
import { cn } from '@/lib/cn';
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
function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'box-border shrink-0 rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2',
        className,
      )}
    >
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
  const hintId = useId();
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
            {/*
              쪽수는 문서에 딸린 값이라 버전·날짜와 나란히 둔다. 바닥에 두면 회색 문장
              사이에 숫자가 끼어 무엇이 무슨 말인지 흐려진다 (시안 h30의 알약은 셋이었고
              그중 하나가 9/3에 빠져 자리가 비어 있다).
              좁은 화면에서는 제목과 알약이 서로 밀어내므로 뺀다 — 대화의 초안 카드에 같은 값이 있다.
            */}
            {doc.pageCount > 0 && <Pill className="max-sm:hidden">{doc.pageCount}쪽</Pill>}
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
                aria-describedby={hintId}
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

            {/*
              적어 봐야 반영되지 않는 요청이 있다는 걸 알린다 (9/6 시연 피드백).
              "제 속도는 45km였습니다"처럼 영상에서 확인된 사실과 어긋나는 주장은
              경위서에 들어가지 않는데, 그걸 모르면 다시 쓰기가 고장 난 것처럼 보인다.

              모래빛으로 칠한다 — 아래 참고용 고지와 같은 회색으로 두면 12.5px 문장 둘이
              한 덩어리로 뭉쳐 무엇이 무슨 말인지 구분되지 않는다. 모래빛 점 + 모래빛 글자는
              화면 곳곳에서 "확인 필요"를 가리키는 짝이라(11_DesignSystem) 뜻도 맞는다.
            */}
            <p id={hintId} className="flex items-center gap-1 text-[12.5px] leading-[1.5]">
              {/* 6px 색점은 간격 규칙(4의 배수)의 정해진 예외다 — 화면 곳곳의 "확인 필요"와 같은 짝 */}
              <span className="size-1.5 shrink-0 rounded-full bg-sand" aria-hidden />
              <span className="min-w-0 text-sand-text">
                블랙박스 내용과 어긋나는 주관적인 의견은 경위서에 반영되지 않아요.
              </span>
            </p>

            <span className="text-[12.5px] leading-[1.5] text-muted">{DISCLAIMER}</span>
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
