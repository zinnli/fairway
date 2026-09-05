import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { DISCLAIMER, REQUIRE_CLAIM_NO } from '@/config';
import type { Rebuttal } from '@/domain/document';

/**
 * S6 반박의견서 보내기 — h33·h34. 가운데 모달(폭 640).
 *
 * 받는이와 접수번호가 둘 다 채워져야 보내기가 열린다 (기능명세 4.1·4.2).
 * 접수번호를 필수로 볼지는 팀 미확정이라 config의 REQUIRE_CLAIM_NO를 따른다.
 * 잠금은 opacity가 아니라 색 교체다.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 제목은 접수번호를 넣어 자동으로 만든다 (h34) */
const subjectOf = (claimNo: string) =>
  claimNo.trim() ? `과실비율 재검토 요청 (접수번호 ${claimNo.trim()})` : '과실비율 재검토 요청';

export function RebuttalDialog({
  open,
  doc,
  claimNo: initialClaimNo,
  sending,
  onClose,
  onSend,
}: {
  open: boolean;
  doc: Rebuttal | null;
  claimNo: string | null;
  sending?: boolean;
  onClose: () => void;
  onSend: (draft: Rebuttal) => void;
}) {
  const [to, setTo] = useState('');
  const [claimNo, setClaimNo] = useState('');
  const [body, setBody] = useState('');
  const [dropped, setDropped] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  /**
   * 칸을 채우는 것은 **열 때 한 번뿐이다.**
   *
   * 전에는 `doc`의 정체가 바뀌면 다시 채웠는데, 그 정체는 대화 카드에서 나온다.
   * SSE가 끊겼다 붙으면 lost 처리가 대화를 통째로 다시 읽어(reset) 카드가 새 객체가
   * 되고, 그 순간 적어 넣던 받는이·접수번호·본문이 초안 값으로 덮여 사라졌다.
   * 한참 치다가 갑자기 화면이 되돌아가는 것처럼 보이던 것이 이것이다.
   *
   * 여는 쪽(openRebuttal)이 **전문을 받아 온 뒤에** 열어 주므로,
   * 열리는 순간의 doc이 이미 최종본이다.
   */
  const [seededOpen, setSeededOpen] = useState(false);
  if (open && !seededOpen) {
    setSeededOpen(true);
    setTo(doc?.to ?? '');
    setBody(doc?.body ?? '');
    setClaimNo(initialClaimNo ?? '');
    setDropped([]);
    setTouched(false);
  }
  if (!open && seededOpen) setSeededOpen(false);

  /* 서버가 빼 둔 첨부 — 왜 빠졌는지 사정이 함께 온다 (25MB 초과 등) */
  const excluded = doc ? doc.attachments.filter((a) => !a.included && a.note) : [];
  const attachments = doc
    ? doc.attachments.filter((a) => a.included && !dropped.includes(a.id))
    : [];
  const toError = touched && !EMAIL.test(to.trim())
    ? '이메일 주소가 아니에요. name@company.co.kr 처럼 고치면 보내기가 열려요.'
    : undefined;
  const claimError =
    touched && REQUIRE_CLAIM_NO && !claimNo.trim() ? '접수번호를 넣어 주세요.' : undefined;
  /* 보낸 문서는 그대로 보관되고 고칠 수 없다 (명세 G-2 editable · h29 안내) */
  const alreadySent = doc?.sentAt != null;
  const canSend =
    EMAIL.test(to.trim()) &&
    (!REQUIRE_CLAIM_NO || claimNo.trim().length > 0) &&
    !sending &&
    !alreadySent;

  const send = () => {
    setTouched(true);
    if (!canSend || !doc) return;
    onSend({
      ...doc,
      to: to.trim(),
      claimNo: claimNo.trim() || null,
      subject: subjectOf(claimNo),
      body,
      attachments: doc.attachments.map((a) => ({
        ...a,
        included: a.included && !dropped.includes(a.id),
      })),
    });
  };

  return (
    <Dialog
      open={open && doc !== null}
      onClose={onClose}
      title="반박의견서 보내기"
      width={640}
      footer={
        <div className="flex w-full flex-col gap-3">
          {/*
            잠금 이유를 단추에 붙이지 않는다 — Button이 lockedReason을 받으면 제 자신을
            세로 flex로 감싸서, 글이 나타나는 순간 바닥의 단추 두 개가 밀려 흐트러진다.
            무엇이 모자란지는 이미 각 칸의 오류 문구가 말해 준다.
            보낸 문서라는 사정만 자리가 고정된 한 줄로 남긴다.
          */}
          {alreadySent && (
            <p className="text-[12.5px] leading-[1.5] text-muted">
              보낸 문서는 수정할 수 없어요. 다시 보내려면 새 문서로 만들어요.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button onClick={send} disabled={!canSend}>
              {sending ? '보내는 중…' : '보내기'}
            </Button>
          </div>
          <p className="text-[12.5px] leading-[1.5] text-muted">{DISCLAIMER}</p>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <Field
          label="받는이 (필수)"
          type="email"
          autoComplete="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          onBlur={() => setTouched(true)}
          error={toError}
        />

        <div className="flex flex-col gap-1">
          <Field
            label="접수번호 (필수)"
            value={claimNo}
            onChange={(e) => setClaimNo(e.target.value)}
            onBlur={() => setTouched(true)}
            error={claimError}
          />
          {!claimError && (
            <p className="text-[12.5px] text-muted">보험사 접수 문자나 메일에 있어요</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[12.5px] font-medium text-muted">
            제목 (접수번호를 넣어 자동으로 만들어요)
          </p>
          <p className="box-border flex min-h-11 items-center rounded-md border border-line bg-bg-2 px-4 text-[15px] text-ink-3">
            {subjectOf(claimNo)}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="rebuttal-body" className="text-[12.5px] font-medium text-muted">
            본문
          </label>
          <textarea
            id="rebuttal-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="box-border resize-none rounded-md border border-line bg-surface px-4 py-3 text-[15px] leading-[1.6] text-ink focus-visible:border-brand"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[12.5px] font-medium text-muted">첨부</p>
          <div className="flex flex-wrap gap-2">
            {attachments.length === 0 ? (
              <p className="text-[13.5px] text-muted">첨부 없이 보냅니다.</p>
            ) : (
              attachments.map((a) => (
                <span
                  key={a.id}
                  className="box-border inline-flex items-center gap-1 rounded-full border border-line bg-surface py-1 pr-1 pl-3 text-[12.5px] font-medium text-ink-2"
                >
                  {a.label}
                  <button
                    type="button"
                    aria-label={`${a.label} 빼기`}
                    onClick={() => setDropped((d) => [...d, a.id])}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-bg-2"
                  >
                    <Icon name="close" size={12} />
                  </button>
                </span>
              ))
            )}
          </div>
          {excluded.map((a) => (
            <p key={a.id} className="text-[12.5px] leading-[1.5] text-sand-text">
              {a.label} — {a.note}
            </p>
          ))}
          <p className="text-[12.5px] leading-[1.5] text-muted">
            영상에는 상대 차량 번호판 등 다른 사람의 정보가 담길 수 있어요. 보험사 담당자에게만 보내
            주세요. ×를 누르면 빼고 보낼 수 있어요.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
