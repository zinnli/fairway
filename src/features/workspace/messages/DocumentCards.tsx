import { Dots } from '@/components/ui/Dots';
import { Button } from '@/components/ui/Button';
import { DISCLAIMER } from '@/config';
import type { Rebuttal, Statement } from '@/domain/document';
import { versionLabel } from '@/lib/document';
import { AiMessage, AiNote, AiText } from './AiMessage';

function timeLabel(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * 사건경위서 초안 — h26 (h28의 서류 카드도 같은 부품이다).
 * 9/3 축소로 "대화 N건 반영"과 쟁점 캡션이 빠졌다 (04 문서 C8·C9).
 * [다시 쓰기]는 9/4에 되살렸다 — 누르면 새 버전 카드가 아래에 하나 더 붙는다.
 */
export function StatementDraftCard({
  doc,
  onOpen,
  onPrint,
  onRewrite,
  rewriting,
  onCreateRebuttal,
  withDisclaimer,
}: {
  doc: Statement;
  onOpen: () => void;
  onPrint: () => void;
  onRewrite: () => void;
  /** 다시 쓰는 중. 진행 화면(h31)이 없어서 단추 하나로만 알린다 */
  rewriting?: boolean;
  onCreateRebuttal: () => void;
  withDisclaimer?: boolean;
}) {
  return (
    <AiMessage className="gap-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="text-[15px] font-semibold text-ink">사건경위서 초안이 준비됐어요</p>
        <p className="text-[12.5px] font-medium text-muted">
          {versionLabel(doc.version)}
          {/* 장수는 서버가 만든 PDF를 세어 준 값이다. 못 받으면 지어내지 않고 숨긴다 */}
          {doc.pageCount > 0 && ` · ${doc.pageCount}장`}
        </p>
      </div>

      {/* 서버는 미리보기를 문장으로 준다. 목처럼 전문을 들고 있을 때만 우리가 만든다 */}
      <div className="flex flex-col gap-2 rounded-md border border-line-2 bg-surface p-4">
        {(doc.preview ??
          doc.sections
            .slice(0, 2)
            .map((s, i) => `${i + 1}. ${s.title} — ${s.body.slice(0, 40)}…`)
        ).map((line) => (
          <p key={line} className="text-[13.5px] leading-[1.6] text-ink-3">
            {line}
          </p>
        ))}
        <p className="text-[12.5px] text-muted">이하 생략 — 전문 보기</p>
      </div>

      <AiNote>채팅에서 나눈 이야기와 영상 분석 결과를 반영했어요.</AiNote>

      {/* 시안 h26 그대로 — 윗줄은 서류를 다루는 단추, 아랫줄이 다음 걸음이다 */}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onOpen}>
          전문 보기
        </Button>
        <Button variant="secondary" onClick={onRewrite} disabled={rewriting}>
          {rewriting ? (
            <>
              다시 쓰는 중
              <Dots label="다시 쓰는 중" />
            </>
          ) : (
            '다시 쓰기'
          )}
        </Button>
        <Button variant="secondary" onClick={onPrint}>
          PDF 받기
        </Button>
      </div>
      <Button className="self-start" onClick={onCreateRebuttal}>
        반박의견서 만들기
      </Button>

      {withDisclaimer && (
        <p className="text-[12.5px] leading-[1.5] text-muted">{DISCLAIMER}</p>
      )}
    </AiMessage>
  );
}

/** 반박의견서 초안 — h33 */
export function RebuttalDraftCard({ doc, onOpen }: { doc: Rebuttal; onOpen: () => void }) {
  const attached = doc.attachments.filter((a) => a.included).length;
  return (
    <AiMessage className="gap-3">
      <p className="text-[15px] font-semibold text-ink">반박의견서 초안이 준비됐어요</p>
      <div className="flex flex-col gap-1 rounded-md border border-line-2 bg-surface p-4 text-[13.5px] leading-[1.6]">
        <p className="text-ink-3">
          받는이 <span className="text-ink">{doc.to}</span>
        </p>
        <p className="text-ink-3">
          제목 <span className="text-ink">{doc.subject}</span>
        </p>
        <p className="text-muted">첨부 {attached}개</p>
      </div>
      <Button className="self-start" onClick={onOpen}>
        열어 보기
      </Button>
    </AiMessage>
  );
}

/** 발송 완료 — h29 */
export function SentCard({ at, to }: { at: string; to: string }) {
  return (
    <AiMessage className="gap-2">
      <p className="text-[15px] font-semibold text-ink">반박의견서를 보냈어요</p>
      <AiText>
        {timeLabel(at)} · {to}
      </AiText>
      <AiNote>보낸 문서는 그대로 보관되고 수정할 수 없어요. 다시 보내려면 새 문서로 만들어요.</AiNote>
    </AiMessage>
  );
}

/** 다음 할 일 — h29. 서버가 주면 그것을 쓰고, 없으면 이 문구다 */
const NEXT_STEPS = [
  '보험사 회신을 기다려요 (보통 3~7일)',
  '회신이 오면 채팅에 붙여넣어 주세요 — 함께 따져 볼게요',
  '받아들여지지 않으면 내 보험사에 분쟁심의(보험사끼리 과실비율을 다시 따지는 절차) 청구를 요청하는 방법을 안내해 드려요',
];

export function NextStepsCard({
  steps = NEXT_STEPS,
  onOpenProcess,
}: {
  steps?: string[];
  onOpenProcess: () => void;
}) {
  return (
    <AiMessage className="gap-3">
      <p className="text-[15px] font-semibold text-ink">다음 할 일</p>
      <ol className="flex flex-col gap-2 text-[14px] leading-[1.6] text-ink">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2">
            <span className="tnum shrink-0 text-muted">{i + 1}.</span>
            <span className="min-w-0">{step}</span>
          </li>
        ))}
      </ol>
      <Button variant="secondary" className="self-start" onClick={onOpenProcess}>
        분쟁심의 절차 미리 보기
      </Button>
    </AiMessage>
  );
}
