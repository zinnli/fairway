import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { service } from '@/api';
import { TERMS, type TermKey } from './terms';

/** 화면의 동의 키 → 서버의 문서 종류 (명세 A-11) */
const DOC_TYPE = {
  service: 'terms',
  privacy: 'privacy',
  video: 'video-consent',
} as const;

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
 * 서버 전문은 **마크다운이다** (A-11 `bodyMarkdown`). 그대로 문단으로 뿌리면
 * 화면에 `## 1. 목적`이 글자 그대로 보인다.
 *
 * 라이브러리를 들이지 않는다 — 실제로 오는 것은 `## 제목`과 문단 두 가지뿐이고
 * (약관·개인정보·영상동의 3종 모두 같은 모양), 목록·굵게까지만 곁들이면 남는 것이 없다.
 * 아는 표시가 아니면 글자 그대로 두어, 못 그리는 문서라도 내용은 다 읽히게 한다.
 */
type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'list'; items: string[] };

function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push({ kind: 'para', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ kind: 'list', items: list });
    list = [];
  };

  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    const heading = /^#{1,4}\s+(.+)$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      blocks.push({ kind: 'heading', text: heading[1] });
      continue;
    }
    const item = /^[-*]\s+(.+)$/.exec(line);
    if (item) {
      flushPara();
      list.push(item[1]);
      continue;
    }
    flushList();
    /* 이어지는 줄은 한 문단으로 잇는다 — 마크다운에서 줄바꿈 하나는 줄을 바꾸지 않는다 */
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

/** `**굵게**`만 살린다. 나머지 기호는 글자 그대로 둔다 */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <b key={i} className="font-semibold">
        {part.slice(2, -2)}
      </b>
    ) : (
      part
    ),
  );
}

/**
 * 제목은 굵은 한 줄로 둔다 — 시안 h40의 영상 동의 전문이 그 모양이라(굵은 소제목 + 문단),
 * 서버 글도 같은 자리에서 같게 읽히게 한다. 글자 크기를 새로 만들지 않는다.
 */
function Markdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2">
      {parseMarkdown(text).map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <p key={i} className="mt-2 text-[15px] leading-[1.8] font-semibold text-ink first:mt-0">
              {inline(block.text)}
            </p>
          );
        }
        if (block.kind === 'list') {
          return (
            <ul key={i} className="flex list-disc flex-col gap-1 pl-5">
              {block.items.map((item, j) => (
                <li key={j} className="text-[15px] leading-[1.8] text-ink">
                  {inline(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[15px] leading-[1.8] text-ink">
            {inline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * P-6 약관·개인정보 팝업 — h40.
 * 동의 3종이 이 부품 하나를 돌려쓴다. 읽기 전용이고, 동의는 가입 화면의 체크박스가 맡는다.
 *
 * 전문은 서버가 정본이다 (A-11). 이용약관·개인정보 두 건은 시안에 문구가 없어
 * 지어내지 않고 비워 뒀는데, 서버가 올려 주면 그 글이 그대로 채워진다.
 */
export function TermsDialog({ term, onClose }: { term: TermKey | null; onClose: () => void }) {
  const doc = term ? TERMS[term] : null;
  /* 서버가 올려 둔 전문. 어느 문서 것인지까지 들고 있어서 창을 바꾸면 저절로 무효가 된다 */
  const [fetched, setFetched] = useState<{ term: TermKey; body: string } | null>(null);
  const remote = fetched?.term === term ? fetched.body : null;

  useEffect(() => {
    if (!term) return;
    let alive = true;
    void service.getLegalDoc(DOC_TYPE[term]).then((body) => {
      if (alive && body) setFetched({ term, body });
    });
    return () => {
      alive = false;
    };
  }, [term]);

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
        {/* 서버 전문이 있으면 그것이 정본이다 — 마크다운으로 온다 (A-11) */}
        {remote && <Markdown text={remote} />}
        {!remote &&
          doc?.sections.map((section) => (
            <p key={section.heading} className="text-[15px] leading-[1.8] text-ink">
              <b className="font-semibold">{section.heading}</b>
              <br />
              {section.body}
            </p>
          ))}
        {!remote && doc?.sections.length === 0 && (
          <p className="text-[15px] leading-[1.8] text-muted">
            문구가 아직 준비되지 않았어요. 법무 검토를 거쳐 넣습니다.
          </p>
        )}
        {!remote && (
          <p className="text-[12.5px] leading-[1.6] text-muted">
            이 글은 시안용 예시예요. 실제 문구는 법무 검토를 거쳐 넣습니다.
          </p>
        )}
      </div>
    </Dialog>
  );
}
