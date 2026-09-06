import type {
  Case,
  CaseStatus,
  CaseSummary,
  Facts,
  Stages,
  StageState,
  VideoRef,
} from '@/domain/case';
import type { ChatMessage } from '@/domain/message';
import type { Rebuttal, Statement } from '@/domain/document';
import type { Precedent, Ratio, Verdict } from '@/domain/verdict';
import type {
  CaseDto,
  CaseStatusDto,
  CaseSummaryDto,
  FactsDto,
  MessageDto,
  RatioDto,
  RebuttalDto,
  ReportFullDto,
  StageStateDto,
  StagesDto,
  TextPayloadDto,
  GuidePayloadDto,
  VideoAttachmentPayloadDto,
  VerdictPayloadDto,
  ReportDraftPayloadDto,
  RebuttalLockedPayloadDto,
  RebuttalDraftPayloadDto,
  SentPayloadDto,
  VideoDto,
} from './dto';

/**
 * **경계선.** 서버 모양(dto.ts)과 화면 모양(domain/)을 아는 유일한 파일이다.
 * endpoints/는 도메인을 모르고, 화면은 dto를 모른다.
 *
 * 규칙: 서버가 안 주는 값을 지어내지 않는다. 없으면 null이거나 빈 값이다.
 */

/* ── 값 ───────────────────────────────────────────────────────────────── */

/** 서버는 other, 화면은 opponent. 이름만 다르고 뜻은 같다 */
export const toRatio = (r: RatioDto): Ratio => ({ mine: r.mine, opponent: r.other });
export const fromRatio = (r: Ratio): RatioDto => ({ mine: r.mine, other: r.opponent });

const STATUS: Record<CaseStatusDto, CaseStatus> = {
  intake: '접수중',
  analyzing: '분석중',
  needs_review: '확인 필요',
  judged: '판정 완료',
  sent: '발송 완료',
  closed: '종결',
};

const STAGE_STATE: Record<StageStateDto, StageState> = {
  pending: '대기',
  in_progress: '진행중',
  done: '완료',
};

/** 단계 이름도 서버와 화면이 다르다 — fault_ratio↔verdict · report↔statement */
export const toStages = (s: StagesDto): Stages => ({
  analysis: STAGE_STATE[s.analysis.state],
  verdict: STAGE_STATE[s.fault_ratio.state],
  statement: STAGE_STATE[s.report.state],
  rebuttal: STAGE_STATE[s.rebuttal.state],
});

/* ── 사건 ─────────────────────────────────────────────────────────────── */

export const toCaseSummary = (c: CaseSummaryDto): CaseSummary => ({
  id: c.id,
  title: c.title,
  status: STATUS[c.status],
  /** 목록은 정렬에만 쓰므로 서버가 주는 updatedAt으로 둘 다 채운다 */
  createdAt: c.updatedAt,
  updatedAt: c.updatedAt,
});

/** 모르는 source가 오면 video로 본다 (서버가 나중에 늘릴 수 있다) */
const toFacts = (f: FactsDto | null | undefined): Facts | null =>
  f
    ? {
        confirmed: f.confirmed,
        total: f.total,
        label: f.label,
        items: f.items.map((i) => ({
          label: i.label,
          source: i.source === 'pending' || i.source === 'user' ? i.source : 'video',
        })),
      }
    : null;

export function toCase(c: CaseDto, verdict: Verdict | null = null): Case {
  return {
    id: c.id,
    title: c.title,
    status: STATUS[c.status],
    stages: toStages(c.stages),
    video: c.video
      ? {
          id: c.video.id,
          name: c.video.filename,
          sizeBytes: 0,
          sizeLabel: c.video.sizeLabel,
          durationSec: c.video.durationSec,
        }
      : null,
    /** 목록 응답의 verdict는 비율만 있다. 근거까지 필요한 곳은 E-1을 따로 부른다 */
    verdict,
    /* ★ 서버가 주지 않는 값들. 화면에서 쓰는 곳이 없어 비워 둔다 */
    accidentAt: null,
    accidentPlace: null,
    claimNo: null,
    facts: toFacts(c.facts),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

/* ── 영상 ─────────────────────────────────────────────────────────────── */

export const toVideoRef = (v: VideoDto): VideoRef => ({
  id: v.id,
  name: v.filename,
  sizeBytes: 0,
  sizeLabel: v.sizeLabel,
  durationSec: v.durationSec,
  /** 서명이 붙어 있고 10분이면 만료된다. 오래 열어 두는 화면은 다시 받는다 */
  streamUrl: v.streamUrl,
});

/* ── 판정 ─────────────────────────────────────────────────────────────── */

export const toPrecedent = (p: { id: string; title: string }): Precedent => ({
  no: p.id,
  summary: p.title,
  /* ★ 뒤집힌 사례 표시(isReversed)는 서버가 주지 않는다 */
});

export function toVerdict(v: VerdictPayloadDto): Verdict {
  const ratio = toRatio(v.ratio);
  return {
    ratio,
    opponentClaim: v.opponentClaim ? toRatio(v.opponentClaim) : null,
    opponentClaimNote: v.opponentClaimNote ?? '',
    conclusion: v.summary,
    /* 번호는 이름 앞머리에 실려 온다 — 따로 받는 칸을 두지 않는다 (9/6) */
    chartName: v.basis.chart.name,
    chartNote: v.basis.chart.note || null,
    /* ★ 서버는 기본 비율·가감 항목을 주지 않는다. 화면에서 쓰는 곳이 없다 */
    baseRatio: ratio,
    adjustments: [],
    precedents: v.basis.precedents.map(toPrecedent),
    createdAt: new Date().toISOString(),
  };
}

/* ── 서류 ─────────────────────────────────────────────────────────────── */

export const toStatement = (r: ReportFullDto): Statement => ({
  version: r.version,
  sections: r.sections.map((s) => ({ title: s.title, body: s.body })),
  pageCount: r.pageCount,
  updatedAt: new Date().toISOString(),
});

export const toRebuttal = (r: RebuttalDto): Rebuttal => ({
  to: r.recipient ?? '',
  claimNo: r.claimNumber,
  subject: r.subject,
  body: r.body,
  attachments: r.attachments.map((a) => ({
    id: a.refId ?? a.kind,
    label: a.name,
    included: a.included,
    note: a.note ?? null,
  })),
  sentAt: r.status === 'sent' ? new Date().toISOString() : null,
});

/* ── 대화 카드 ────────────────────────────────────────────────────────── */

/**
 * 서버 카드 10종 → 화면 카드 10종. 하나씩 맞아떨어지지는 않는다.
 *
 * · `upload_progress` · `analyzing` 은 프론트 로컬이라 목록에 오지 않는다
 * · `rebuttal_locked` 는 화면에 짝이 없어 **글로 떨어뜨린다** (★ 결정 필요)
 * · `sent` 안의 nextSteps 는 서버가 같은 카드에 담아 준다 — 화면은 카드 둘로 나눠 쓴다 (★)
 *
 * 화면이 모르는 종류가 오면 null이다. 목록에서 걸러 낸다 — 없는 카드를 지어내지 않는다.
 */
export function toMessage(m: MessageDto): ChatMessage | null {
  const base = { id: m.id, at: m.createdAt };

  switch (m.type) {
    case 'text': {
      const p = m.payload as TextPayloadDto;
      return {
        ...base,
        role: m.role === 'user' ? 'user' : 'ai',
        kind: 'text',
        text: p.text,
        /* 서버가 붙여 준 단추 (h13 [영상 올리기]) */
        ...(p.cta ? { cta: { label: p.cta.label, action: 'uploadVideo' as const } } : {}),
      };
    }
    case 'guide': {
      /* 문구는 서버가 준다. 화면 GuideCard는 아직 자기 문구를 쓴다 (★) */
      void (m.payload as GuidePayloadDto);
      return { ...base, role: 'ai', kind: 'guide' };
    }
    case 'video_attachment': {
      const p = m.payload as VideoAttachmentPayloadDto;
      return {
        ...base,
        role: 'user',
        kind: 'video',
        video: {
          id: p.videoId,
          name: p.filename,
          sizeBytes: 0,
          sizeLabel: p.sizeLabel,
          durationSec: p.durationSec,
        },
      };
    }
    case 'verdict':
      return { ...base, role: 'ai', kind: 'verdict', verdict: toVerdict(m.payload as VerdictPayloadDto) };

    case 'report_draft': {
      const p = m.payload as ReportDraftPayloadDto;
      return {
        ...base,
        role: 'ai',
        kind: 'statementDraft',
        doc: {
          version: p.version,
          pageCount: p.pageCount,
          /* 카드에는 미리보기 문장만 온다. 전문(sections)은 F-3으로 따로 받는다 */
          preview: p.preview,
          sections: [],
          updatedAt: m.createdAt,
        },
      };
    }
    case 'rebuttal_locked': {
      /* 화면에 짝이 되는 카드가 없다. 종류를 늘리지 않고 단추 달린 글로 받는다 (h27) */
      const p = m.payload as RebuttalLockedPayloadDto;
      return {
        ...base,
        role: 'ai',
        kind: 'text',
        text: p.text,
        cta: { label: '사건경위서 먼저 만들기', action: 'createStatement' as const },
      };
    }
    case 'rebuttal_draft': {
      const p = m.payload as RebuttalDraftPayloadDto;
      return {
        ...base,
        role: 'ai',
        kind: 'rebuttalDraft',
        doc: {
          to: p.recipient ?? '',
          claimNo: p.claimNumber,
          subject: p.subject,
          body: p.bodyPreview,
          attachments: p.attachments.map((a) => ({
            id: a.refId ?? a.kind,
            label: a.name,
            included: a.included,
            note: a.note ?? null,
          })),
          sentAt: null,
        },
      };
    }
    case 'sent': {
      const p = m.payload as SentPayloadDto;
      return { ...base, role: 'ai', kind: 'sent', to: p.recipient, attachmentCount: p.attachmentCount };
    }
    /* 로컬 전용 카드는 서버가 보내지 않는다 */
    case 'upload_progress':
    case 'analyzing':
      return null;
    default:
      return null;
  }
}

/**
 * 서버 카드 하나가 화면 카드 둘이 되기도 한다.
 * `sent` 안에 "다음 할 일"이 같이 들어 있는데, 화면은 카드 둘로 나눠 쓴다 (h29).
 */
export function expandMessage(m: MessageDto): ChatMessage[] {
  const mapped = toMessage(m);
  if (!mapped) return [];
  if (m.type !== 'sent') return [mapped];
  const p = m.payload as SentPayloadDto;
  return [
    mapped,
    { id: `${m.id}:next`, at: m.createdAt, role: 'ai', kind: 'nextSteps', steps: p.nextSteps },
  ];
}

export const toMessages = (items: MessageDto[]): ChatMessage[] => items.flatMap(expandMessage);
