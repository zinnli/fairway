import { Dots } from '@/components/ui/Dots';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { DISCLAIMER, REQUIRE_CLAIM_NO } from '@/config';
import type { Rebuttal, Statement } from '@/domain/document';
import { versionLabel } from '@/lib/document';
import { AiMessage, AiNote, AiText } from './AiMessage';
import { CardHeader, FieldRow, MessageCard, Pill } from './MessageCard';

function timeLabel(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * 사건경위서 초안 — h26 (h28의 서류 카드도 같은 부품이다).
 *
 * 말풍선이 아니라 **흰 카드**다 — 단추까지 카드 안에 들어간다 (시안 h26 · h28).
 * 버전과 장수는 머리글 오른쪽 알약으로 붙는다.
 *
 * 9/3 축소로 "대화 N건 반영"과 쟁점 캡션이 빠졌다 (04 문서 C8·C9 — 되살리지 않았다).
 * [다시 쓰기]는 9/4에 되살렸다 — 누르면 새 버전 카드가 아래에 하나 더 붙는다.
 */
export function StatementDraftCard({
  doc,
  onOpen,
  onPrint,
  onRewrite,
  rewriting,
  onCreateRebuttal,
  rebuttalExists,
  withDisclaimer,
}: {
  doc: Statement;
  onOpen: () => void;
  onPrint: () => void;
  onRewrite: () => void;
  /** 다시 쓰는 중. 진행 화면(h31)이 없어서 단추 하나로만 알린다 */
  rewriting?: boolean;
  onCreateRebuttal: () => void;
  /** 반박의견서 초안이 이미 있는가. 대화는 앞으로만 가서 이 카드가 계속 남아 있다 */
  rebuttalExists?: boolean;
  withDisclaimer?: boolean;
}) {
  return (
    <MessageCard>
      <CardHeader
        icon="file"
        title="사건경위서 초안이 준비됐어요"
        badge={
          <Pill>
            {versionLabel(doc.version)}
            {/* 장수는 서버가 만든 PDF를 세어 준 값이다. 못 받으면 지어내지 않고 숨긴다 */}
            {doc.pageCount > 0 && ` · ${doc.pageCount}장`}
          </Pill>
        }
      />

      {/* 서버는 미리보기를 문장으로 준다. 목처럼 전문을 들고 있을 때만 우리가 만든다 */}
      <div className="flex flex-col gap-2 rounded-md border border-line-2 bg-bg-3 p-4">
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
              <Dots />
            </>
          ) : (
            '다시 쓰기'
          )}
        </Button>
        <Button variant="secondary" onClick={onPrint}>
          PDF 받기
        </Button>
      </div>
      {/*
        판정 카드의 [사건경위서 만들기]와 같은 규칙이다 — 다음 걸음 안내이지 상설
        창구가 아니라, 초안이 생기면 걸음을 디딘 것이므로 내린다.

        내리지 않으면 위험하기도 하다: G-1은 "이미 있음"을 막지 않아서 한 번 더
        누르면 초안이 새로 만들어지고, 적어 둔 받는 이·접수번호가 함께 날아간다.

        길이 막히지는 않는다 — 초안 카드(h28)와 현황판의 서류 줄이 남아 있다.
      */}
      {!rebuttalExists && (
        <Button className="self-start" onClick={onCreateRebuttal}>
          반박의견서 만들기
        </Button>
      )}

      {withDisclaimer && <p className="text-[12.5px] leading-[1.5] text-muted">{DISCLAIMER}</p>}
    </MessageCard>
  );
}

/** 아직 못 채운 칸 — 모래빛 점 + 글자 (11_DesignSystem "확인 필요") */
function Missing({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-1.5 shrink-0 rounded-full bg-sand" aria-hidden />
      <span className="text-sand-text">{children}</span>
    </span>
  );
}

/** 첨부 알약 — 여기서는 보여 주기만 한다. 빼는 것은 다음 창(S6)에서 한다 */
function AttachmentChip({ label }: { label: string }) {
  return (
    <span className="box-border inline-flex min-h-7 items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-[12px] leading-[1.35] font-medium text-ink-2">
      <span className="flex shrink-0 text-muted" aria-hidden>
        <Icon name="file" size={12} />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

/** 공백만 든 칸은 안 넣은 것으로 본다 — 그래야 "아직 …" 자리가 제대로 선다 */
const trimmed = (v: string | null | undefined) => (v ?? '').trim();

/**
 * 반박의견서 초안 — h28.
 *
 * 카드에서 **보낼 내용을 미리 다 보여 준다** — 받는이·접수번호·제목·첨부·본문 첫 줄.
 * 열어 보기 전에도 무엇이 나가는지 알 수 있어야 하고, 아직 못 채운 칸이
 * 무엇인지도 여기서 드러나야 한다 (모래빛 = 확인 필요).
 *
 * 첨부 알약에 ×를 붙이지 않는다. 빼는 것은 다음 창(S6)이 하는 일이라,
 * 여기 ×는 눌리지 않는 단추가 된다. 대신 어디서 뺄 수 있는지 글로 알린다.
 */
export function RebuttalDraftCard({
  doc,
  onOpen,
  sent,
}: {
  doc: Rebuttal;
  onOpen: () => void;
  /**
   * 이미 보냈는가. **카드의 `doc.sentAt`으로는 알 수 없다** — 서버가 주는 카드는
   * 보내기 전 모습 그대로라 늘 null이다(map.ts). 작업 화면이 발송 카드를 보고 알려 준다.
   */
  sent?: boolean;
}) {
  const to = trimmed(doc.to);
  const claimNo = trimmed(doc.claimNo);
  const attached = doc.attachments.filter((a) => a.included);
  /* 서버가 접수번호로 제목을 만든다(G-2 subjectAuto) — 아직 없으면 제목도 덜 된 것이다 */
  const claimNoNeeded = REQUIRE_CLAIM_NO && !claimNo;

  return (
    <MessageCard>
      <CardHeader icon="file" title="반박의견서 초안이 준비됐어요" />

      <FieldRow label="받는이">
        {to ? <span className="text-ink">{to}</span> : <span className="text-muted">아직 안 정했어요</span>}
      </FieldRow>

      <FieldRow label="접수번호" align={claimNo ? 'baseline' : 'start'}>
        {claimNo ? (
          <span className="tnum text-ink">{claimNo}</span>
        ) : (
          <>
            <Missing>아직 안 넣었어요</Missing>
            <span className="text-[12.5px] leading-[1.5] text-muted">
              보험사 접수 문자나 메일에 있어요 · 이걸 넣어야 보험사가 사건을 찾을 수 있어요
            </span>
          </>
        )}
      </FieldRow>

      <FieldRow label="제목">
        <span className="text-ink">
          {doc.subject}
          {claimNoNeeded && <span className="text-sand-text"> (접수번호는 아직 안 넣었어요)</span>}
        </span>
      </FieldRow>

      {attached.length > 0 && (
        <FieldRow label="첨부" align="start">
          <span className="flex flex-wrap gap-2">
            {attached.map((a) => (
              <AttachmentChip key={a.id} label={a.label} />
            ))}
          </span>
          <span className="text-[12.5px] leading-[1.5] text-muted">
            영상에는 다른 차량 번호판이 담길 수 있어요 · 다음 창에서 ×로 뺄 수 있어요
          </span>
        </FieldRow>
      )}

      {/* 본문 첫 줄 — 서버가 준 글을 그대로 따온다. 지어내지 않는다 */}
      <p className="text-[14px] leading-[1.6] text-ink-3">
        “{doc.body.trim().split('\n')[0].slice(0, 90)}…”
      </p>

      {/* 보내고 나면 더 보낼 것이 없다 — 단추는 남기되 하는 일만큼만 말한다 */}
      <Button size="lg" className="self-start" onClick={onOpen}>
        {sent ? '반박의견서 확인하기' : '반박의견서 확인하고 보내기'}
      </Button>
    </MessageCard>
  );
}

/** 발송 완료 — h29 */
export function SentCard({
  at,
  to,
  attachmentCount,
}: {
  at: string;
  to: string;
  /** 서버가 실제로 붙인 파일 수. 0도 그대로 보여 준다 — 빠진 것을 알아야 한다 */
  attachmentCount: number;
}) {
  return (
    <AiMessage className="gap-2">
      <p className="text-[15px] font-semibold text-ink">반박의견서를 보냈어요</p>
      {/* 시안 h29 — "08-25 14:32 · kim@insu.co.kr · 첨부 2개" */}
      <AiText>
        {timeLabel(at)} · {to} · 첨부 {attachmentCount}개
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
