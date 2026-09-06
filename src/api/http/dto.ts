/**
 * 서버가 주고받는 모양 그대로. docs/handoff/05_API_명세서.md가 정본이다.
 * **도메인 타입을 여기 섞지 않는다** — 변환은 map.ts 한 곳에서만 한다.
 * 이름·대소문자·null 규칙을 명세와 다르게 적지 않는다.
 */

export interface RatioDto {
  mine: number;
  other: number;
}

export type CaseStatusDto =
  | 'intake'
  | 'analyzing'
  | 'needs_review'
  | 'judged'
  | 'sent'
  | 'closed';

export type StageStateDto = 'pending' | 'in_progress' | 'done';
export type StageKeyDto = 'analysis' | 'fault_ratio' | 'report' | 'rebuttal';
export type StagesDto = Record<StageKeyDto, { state: StageStateDto }>;

export type JobKindDto = 'analysis' | 'verdict' | 'report' | 'rebuttal';
export interface JobDto {
  jobId: string;
  kind: JobKindDto;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  startedAt?: string;
}

/* ── 인증 ─────────────────────────────────────────────────────────────── */

export interface UserDto {
  id: string;
  email: string;
  onboardedAt: string | null;
  isDemo: boolean;
}

export interface SessionDto {
  user: UserDto;
  accessToken: string;
  expiresIn: number;
}

export interface LegalDocDto {
  docType: 'terms' | 'privacy' | 'video-consent';
  title: string;
  version: string;
  bodyMarkdown: string;
}

/* ── 사건 ─────────────────────────────────────────────────────────────── */

export interface CaseSummaryDto {
  id: string;
  title: string;
  status: CaseStatusDto;
  statusLabel: string;
  updatedAt: string;
}

export interface FactsDto {
  confirmed: number;
  total: number;
  label: string;
  items: { label: string; source: 'video' | 'user' | 'pending'; field: string | null }[];
}

export interface CaseDto {
  id: string;
  title: string;
  status: CaseStatusDto;
  statusLabel: string;
  subtitle: string;
  stages: StagesDto;
  verdict: { verdictId: string; ratio: RatioDto } | null;
  verdictPlaceholder: string | null;
  documents: {
    report: { exists: boolean; label: string; version: number | null; pageCount: number | null };
    rebuttal: { exists: boolean; locked: boolean; label: string };
  };
  video: { id: string; filename: string; durationSec: number; sizeLabel: string } | null;
  /** 영상 분석 전에는 null. case.updated 본문에도 같은 값이 온다 */
  facts: FactsDto | null;
  activeJob: JobDto | null;
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}

/* ── 메시지 카드 (§4, 10종) ───────────────────────────────────────────── */

export type MessageTypeDto =
  | 'text'
  | 'guide'
  | 'upload_progress'
  | 'video_attachment'
  | 'analyzing'
  | 'verdict'
  | 'report_draft'
  | 'rebuttal_locked'
  | 'rebuttal_draft'
  | 'sent';

export interface TextPayloadDto {
  text: string;
  cta?: { label: string; type: 'upload_video' } | null;
}

export interface GuidePayloadDto {
  text: string;
  notice: string;
  limitsLabel: string;
}

export interface VideoAttachmentPayloadDto {
  videoId: string;
  filename: string;
  durationSec: number;
  sizeLabel: string;
  recordedAt: string | null;
  meta: { speedKph?: number; impactAtSec?: number } | null;
}

export interface PrecedentRefDto {
  id: string;
  title: string;
}

export interface VerdictPayloadDto {
  verdictId: string;
  version: number;
  changeReason: string | null;
  ratio: RatioDto;
  summary: string;
  opponentClaim: RatioDto | null;
  /** 항상 온다. 주장이 없을 때는 "아직 없어요 …"를 알려 주는 문장이 온다 */
  opponentClaimNote: string;
  basis: {
    chart: { name: string; note: string };
    precedents: PrecedentRefDto[];
  };
  canCreateReport: boolean;
  disclaimer: string;
}

export interface ReportDraftPayloadDto {
  reportId: string;
  version: number;
  versionLabel: string;
  pageCount: number;
  preview: string[];
  caveat: string | null;
  canCreateRebuttal: boolean;
}

export interface RebuttalLockedPayloadDto {
  text: string;
  missing: ('verdict' | 'report')[];
  buttonLabel: string;
  buttonHint: string;
}

export interface AttachmentDto {
  kind: 'report_pdf' | 'video';
  refId?: string;
  name: string;
  sizeBytes?: number;
  included: boolean;
  note?: string | null;
}

export interface RebuttalDraftPayloadDto {
  rebuttalId: string;
  recipient: string | null;
  recipientPlaceholder: string;
  claimNumber: string | null;
  claimNumberHint: string;
  subject: string;
  bodyPreview: string;
  attachments: AttachmentDto[];
  attachmentNotice: string;
  canSend: boolean;
  blockedBy: string[];
}

export interface SentPayloadDto {
  sendLogId: string;
  sentAt: string;
  recipient: string;
  attachmentCount: number;
  notice: string;
  nextSteps: string[];
}

export type MessagePayloadDto =
  | TextPayloadDto
  | GuidePayloadDto
  | VideoAttachmentPayloadDto
  | VerdictPayloadDto
  | ReportDraftPayloadDto
  | RebuttalLockedPayloadDto
  | RebuttalDraftPayloadDto
  | SentPayloadDto;

export interface MessageDto {
  id: string;
  caseId: string;
  role: 'user' | 'assistant';
  type: MessageTypeDto;
  payload: MessagePayloadDto;
  createdAt: string;
}

export interface MessageListDto {
  items: MessageDto[];
  hasMore: boolean;
  nextCursor: string | null;
}

/* ── 영상 ─────────────────────────────────────────────────────────────── */

export interface VideoUploadedDto {
  video: {
    id: string;
    filename: string;
    sizeBytes: number;
    sizeLabel: string;
    durationSec: number;
    mimeType: string;
    recordedAt: string | null;
  };
  analysis: { started: boolean; jobId: string | null };
  needsDescription: boolean;
}

export interface VideoDto {
  id: string;
  caseId: string;
  filename: string;
  sizeLabel: string;
  durationSec: number;
  durationLabel: string;
  recordedAt: string | null;
  meta: { speedKph?: number; impactAtSec?: number; impactLabel?: string } | null;
  /** 이미 서명 토큰이 붙어 있다. 유효 10분 */
  streamUrl: string;
  notice: string;
}

/* ── 판정 · 심의사례 ──────────────────────────────────────────────────── */

export interface VerdictReadDto {
  verdict: VerdictPayloadDto | null;
  placeholder?: string | null;
}

export interface PrecedentDto {
  precedentId: string;
  title: string;
  /** \n\n 으로 문단을 나눈다. 소제목도 문단 하나로 온다 */
  bodyText: string;
  /** 서명이 붙은 **상대** 주소. 조립하지 않고 그대로 쓴다. 없으면 null */
  imageUrl: string | null;
  /** 그림 아래 출처 한 줄. imageUrl이 null이면 같이 null */
  imageCaption: string | null;
}

/* ── 사건경위서 ───────────────────────────────────────────────────────── */

export interface ReportFullDto {
  reportId: string;
  version: number;
  versionLabel: string;
  dateLabel: string;
  pageCount: number;
  intro: string;
  sections: { index: number; title: string; body: string }[];
  revisionPlaceholder: string;
  disclaimer: string;
}

export interface ReportPdfDto {
  pdfId: string;
  version: number;
  filename: string;
  sizeBytes: number;
  downloadUrl: string;
  createdAt: string;
}

/* ── 반박의견서 ───────────────────────────────────────────────────────── */

export interface RebuttalDto {
  rebuttalId: string;
  status: 'draft' | 'sent';
  recipient: string | null;
  claimNumber: string | null;
  claimNumberHint: string;
  subject: string;
  subjectAuto: boolean;
  body: string;
  attachments: AttachmentDto[];
  attachmentNotice: string;
  fromEmail: string;
  canSend: boolean;
  blockedBy: string[];
  editable: boolean;
}

export interface SendResultDto {
  sendLogId: string;
  status: string;
  fromEmail: string;
  recipient: string;
  attachmentCount: number;
}

/* ── 공통 목록 봉투 ───────────────────────────────────────────────────── */

export interface ListDto<T> {
  items: T[];
  hasMore?: boolean;
  nextCursor?: string | null;
}
