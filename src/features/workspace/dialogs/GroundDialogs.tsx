import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { Precedent } from '@/domain/verdict';

/**
 * 판정 카드에서 여는 팝업.
 * 9/3 축소로 P-2 인정기준 도표(h38)와 P-4 변경 이력(h39)이 빠졌다.
 * 남은 것은 심의사례(P-1)와 분쟁심의 절차 안내(F-04)뿐이다.
 */

/** 팝업 본문 한 줄 — 이름/값 */
function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12.5px] font-medium text-muted">{label}</p>
      <div className="text-[14px] leading-[1.6] text-ink">{children}</div>
    </div>
  );
}

/**
 * `bodyText`의 소제목 목록 — 서버가 문단 하나로 이 글자를 그대로 보낸다.
 * 앞쪽은 **그 사례의 내용**, 뒤쪽은 **내 사건과의 관계**다. 늘 이 순서로 온다.
 * (인정기준 도표일 때는 앞부분이 `기본 과실비율`·`수정요소`로 바뀐다)
 */
const CASE_LABELS = [
  '사고 유형',
  '사고 내용',
  '쟁점',
  '과실비율',
  '심의 이유',
  '적용 수정요소',
  '참고 인정기준',
  '기본 과실비율',
  '수정요소',
];
const RELATION_LABELS = ['내 사건과 비슷한 점', '내 사건과 다른 점', '판정에서의 역할'];
const LABELS = new Set([...CASE_LABELS, ...RELATION_LABELS]);
/** 비율만 굵게 — 화살표(→)는 글자 그대로 둔다 */
const RATIO_LABELS = new Set(['과실비율', '기본 과실비율']);

interface Section {
  label: string | null;
  items: string[];
}

/**
 * 빈 줄로 나뉜 문단을 "소제목 + 그 아래 문단들"로 묶는다.
 * 첫 소제목보다 앞선 문단(도표 제목 등)은 label이 없는 묶음으로 남는다.
 */
function toSections(bodyText: string): Section[] {
  const out: Section[] = [];
  for (const raw of bodyText.split('\n\n')) {
    const para = raw.trim();
    if (!para) continue;
    if (LABELS.has(para)) {
      out.push({ label: para, items: [] });
      continue;
    }
    if (out.length === 0) out.push({ label: null, items: [] });
    out[out.length - 1].items.push(para);
  }
  return out;
}

/** "기본 80:20 → 결정 70:30" 에서 숫자 쌍만 굵게 */
function withRatios(text: string) {
  return text.split(/(\d+\s*:\s*\d+)/).map((part, i) =>
    /^\d+\s*:\s*\d+$/.test(part) ? (
      <strong key={i} className="tnum font-semibold">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

/** 묶음 제목 — 서버가 주는 글이 아니라 화면이 넣는 고정 문구다 */
function GroupTitle({ children }: { children: string }) {
  return (
    <p className="border-l-2 border-brand pl-2 text-[12.5px] font-medium text-muted">{children}</p>
  );
}

function SectionBlock({ section }: { section: Section }) {
  /* 판정에서의 역할만 상자다 — 이 사례가 판정에 어떻게 쓰였는지가 결론이라 눈에 띄어야 한다 */
  if (section.label === '판정에서의 역할') {
    return (
      <div className="mt-3 rounded-lg bg-bg-2 p-3">
        <p className="text-[14px] font-semibold text-ink">{section.label}</p>
        <p className="mt-1 text-[14px] leading-[1.6] text-ink">{section.items.join(' ')}</p>
      </div>
    );
  }

  /* 문단이 둘 이상이면 점 목록으로 — 쟁점·비슷한 점처럼 항목이 여럿인 소제목이다 */
  const bulleted = section.items.length > 1;
  const ratio = RATIO_LABELS.has(section.label ?? '');

  return (
    <div className="flex flex-col gap-1">
      {/* 소제목은 색이 아니라 굵기로 가른다 — 정보 글자는 muted까지라는 규칙을 지키기 위해서다 */}
      {section.label && (
        <p className="mt-3 text-[14px] font-semibold text-ink">{section.label}</p>
      )}
      {section.items.map((item, i) => (
        <p key={`${section.label ?? ''}-${i}`} className="text-[14px] leading-[1.6] text-ink">
          {bulleted && (
            <span className="mr-1 text-muted" aria-hidden>
              ·
            </span>
          )}
          {ratio ? withRatios(item) : item}
        </p>
      ))}
    </div>
  );
}

/**
 * 사례 개요 표를 잘라 낸 그림. 주소에 서명이 붙어 있어 헤더를 붙이지 않는다.
 * 서명이 만료됐거나(10분) 그림이 없으면 **그림만 접는다** — 글은 그대로 둔다.
 */
function PrecedentImage({ src, alt, caption }: { src: string; alt: string; caption: string | null }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="flex flex-col gap-2">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full rounded-lg border border-line"
      />
      {caption && <figcaption className="text-[12.5px] text-muted">{caption}</figcaption>}
    </figure>
  );
}

/**
 * P-1 유사 심의사례 — h37. 일치도 배지는 9/3에 빠졌다.
 *
 * 서버가 소제목을 글 안에 넣어 보내므로(문단 하나 = 소제목 또는 문장) 화면이
 * 문단 글자를 보고 구조를 되살린다. 앞부분은 사례 자체, 뒷부분은 내 사건과의 관계다.
 */
export function PrecedentDialog({
  open,
  precedent,
  bodyText,
  imageUrl,
  imageCaption,
  onClose,
}: {
  open: boolean;
  precedent: Precedent | null;
  /** 사례마다 내용이 달라 서버가 글로 써 준다. 오기 전에는 아는 것만 보여 준다 */
  bodyText?: string | null;
  /** 서명이 붙은 주소. 없으면 figure 자체를 그리지 않는다 */
  imageUrl?: string | null;
  imageCaption?: string | null;
  onClose: () => void;
}) {
  const sections = bodyText ? toSections(bodyText) : [];
  const relation = sections.filter((s) => RELATION_LABELS.includes(s.label ?? ''));
  const own = sections.filter((s) => !RELATION_LABELS.includes(s.label ?? ''));

  return (
    <Dialog
      open={open && precedent !== null}
      onClose={onClose}
      title={precedent ? `심의사례 ${precedent.no}` : '심의사례'}
      width={480}
      footer={
        <Button variant="secondary" className="ml-auto" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {precedent && (
        <div className="flex flex-col gap-4">
          {imageUrl && (
            <PrecedentImage
              src={imageUrl}
              alt={`심의사례 ${precedent.no} 사례 개요`}
              caption={imageCaption ?? null}
            />
          )}

          {own.length > 0 && (
            <section className="flex flex-col gap-1">
              <GroupTitle>사례 내용</GroupTitle>
              {own.map((s, i) => (
                <SectionBlock key={s.label ?? `own-${i}`} section={s} />
              ))}
            </section>
          )}

          {relation.length > 0 && (
            <section className="flex flex-col gap-1 border-t border-line pt-4">
              <GroupTitle>내 사건과의 관계</GroupTitle>
              {relation.map((s) => (
                <SectionBlock key={s.label ?? ''} section={s} />
              ))}
            </section>
          )}

          {/* 설명문이 아직 안 왔거나 없는 사례 — 카드가 아는 것만이라도 보여 준다 */}
          {sections.length === 0 && (
            <div className="flex flex-col gap-5">
              <Line label="사고 개요">{precedent.summary}</Line>
              {precedent.isReversed && (
                <Line label="심의 결과">
                  뒤집힘 — 블랙박스로 상대 신호위반이 입증되어 일방과실이 인정된 사례예요.
                </Line>
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

/** F-04 분쟁심의 절차 안내 */
const PROCESS = [
  {
    title: '보험사 회신 검토',
    body: '반박의견서에 대한 회신이 오면 채팅에 붙여넣어 주세요. 받아들여졌는지 함께 따져 봐요.',
  },
  {
    title: '내 보험사에 심의 청구 요청',
    body: '받아들여지지 않으면 내 보험사에 분쟁심의 청구를 요청할 수 있어요. 심의는 보험사끼리 진행돼요 — 개인이 직접 신청하는 곳은 아니에요.',
  },
  {
    title: '심의 결과 확인',
    body: '심의 결과에 따라 과실비율이 조정돼요. 우리가 찾은 유사 사례처럼 뒤집히는 경우도 있어요.',
  },
];

export function ProcessDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="과실비율 분쟁심의, 이렇게 진행돼요"
      footer={
        <Button variant="secondary" className="ml-auto" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <ol className="flex flex-col gap-4">
          {PROCESS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[12.5px] font-semibold text-brand-press">
                {i + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-[14px] font-semibold text-ink">{step.title}</p>
                <p className="text-[13.5px] leading-[1.6] text-ink-3">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-[12.5px] leading-[1.5] text-muted">
          보험사에 심의 청구를 요청하는 서식은 준비 중이에요. 지금은 절차 안내만 제공해요.
        </p>
      </div>
    </Dialog>
  );
}
