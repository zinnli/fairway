import type { Case, CaseSummary, VideoRef } from '@/domain/case';
import type { ChatMessage } from '@/domain/message';
import type { Rebuttal, Statement } from '@/domain/document';
import type { Precedent, Verdict } from '@/domain/verdict';

/**
 * 서비스 계약 — **화면이 아는 유일한 인터페이스.**
 * 화면은 경로도 DTO도 SSE도 모른다. 도메인 타입만 오간다.
 *
 * 20_API명세서_v2를 받고 다시 그렸다. 예전 Api와 크게 다른 두 가지:
 *
 * 1. **분석·판정을 부르지 않는다.** 영상을 올리거나 글을 보내면 서버가 알아서 Job을 돌리고,
 *    결과 카드는 subscribe()로 들어온다. analyze()·answerQuestion()·judge()는 사라졌다.
 * 2. **카드를 화면이 만들지 않는다.** 서버가 만들어 SSE로 밀어 준다.
 *    화면이 직접 쌓는 것은 업로드 중·분석 중 두 장뿐이고, 그 둘은 서버에 저장되지 않는다.
 */

/** 실시간 채널이 물어다 주는 것 (명세 §6) */
export interface CaseEvents {
  /** 새 카드가 왔다. 대화 맨 뒤에 붙인다 */
  message?: (message: ChatMessage) => void;
  /** 이미 있는 카드가 바뀌었다 (영상 meta 채움 · 경위서 버전 갱신) */
  messageUpdated?: (message: ChatMessage) => void;
  /** 사건이 바뀌었다. 사이드바 배지·현황판·로딩 표시를 이걸로 맞춘다 */
  caseUpdated?: (item: Case, activeJob: ActiveJob | null) => void;
  rebuttalSent?: (at: string, to: string) => void;
  /** 채널이 끊겼고 되살리지 못했다 — 화면이 사건과 대화를 다시 읽는다 */
  lost?: () => void;
}

/** 지금 도는 작업. 화면은 종류만 보고 로딩을 그린다 (단계는 내려오지 않는다) */
export interface ActiveJob {
  kind: 'analysis' | 'verdict' | 'report' | 'rebuttal';
}

export interface UploadResult {
  video: VideoRef;
  /** 설명이 아직 없어 분석이 시작되지 않았다. 서버가 청하는 문구를 SSE로 보낸다 */
  needsDescription: boolean;
  analysisStarted: boolean;
}

export interface CaseDetail {
  item: Case;
  activeJob: ActiveJob | null;
}

export interface Session {
  id: string;
  email: string;
  onboardedAt: string | null;
  isDemo: boolean;
}

export interface CaseService {
  /* ── 인증 ─────────────────────────────────────────────── */
  login(email: string, password: string): Promise<Session>;
  signup(input: {
    email: string;
    password: string;
    passwordConfirm: string;
    agreements: { termsOfService: boolean; privacy: boolean; videoConsent: boolean };
  }): Promise<Session>;
  logout(): Promise<void>;
  /** 가입 전에 미리 물어보는 보조 수단 (A-6). 진짜 판정은 signup이 한다 */
  isEmailAvailable(email: string): Promise<{ available: boolean; reason: string | null }>;
  /** 새로고침 뒤 세션 되살리기. 쿠키만으로 동작하고, 실패하면 null */
  restoreSession(): Promise<Session | null>;
  completeOnboarding(skipped: boolean): Promise<void>;
  /** 약관 전문 (A-11). 서버가 없으면 null — 화면이 아는 문구로 대신한다 */
  getLegalDoc(docType: 'terms' | 'privacy' | 'video-consent'): Promise<string | null>;
  /** 재설정 메일 보내기 (A-7). 가입되지 않은 주소여도 성공으로 답한다 */
  requestPasswordReset(email: string): Promise<string>;
  /** 메일 링크로 돌아와 새 비밀번호를 정한다 (A-8). 토큰은 30분 · 1회용 */
  resetPassword(input: {
    token: string;
    password: string;
    passwordConfirm: string;
  }): Promise<string>;

  /* ── 사건 ─────────────────────────────────────────────── */
  listCases(): Promise<CaseSummary[]>;
  getCase(caseId: string): Promise<CaseDetail>;
  createCase(): Promise<Case>;
  renameCase(caseId: string, title: string): Promise<void>;
  deleteCase(caseId: string): Promise<void>;

  /* ── 대화 ─────────────────────────────────────────────── */
  listMessages(caseId: string): Promise<ChatMessage[]>;
  /** 보내고 나면 답은 subscribe로 온다. 돌려주는 건 내가 친 글 한 장뿐이다 */
  sendMessage(caseId: string, text: string): Promise<ChatMessage>;
  uploadVideo(
    caseId: string,
    file: File,
    onProgress: (percent: number) => void,
  ): Promise<UploadResult>;
  getVideo(videoId: string): Promise<VideoRef>;

  /* ── 판정 ─────────────────────────────────────────────── */
  getVerdict(caseId: string): Promise<Verdict | null>;
  /** H37 — 사례마다 내용이 달라 글 한 덩이로 온다 */
  getPrecedentText(caseId: string, precedent: Precedent): Promise<string>;

  /* ── 사건경위서 ───────────────────────────────────────── */
  createStatement(caseId: string): Promise<void>;
  reviseStatement(caseId: string, request: string): Promise<void>;
  getStatement(caseId: string): Promise<Statement>;
  downloadStatementPdf(caseId: string, version: number): Promise<void>;

  /* ── 반박의견서 ───────────────────────────────────────── */
  createRebuttal(caseId: string): Promise<void>;
  getRebuttal(caseId: string): Promise<Rebuttal>;
  updateRebuttal(caseId: string, patch: Partial<Rebuttal>): Promise<Rebuttal>;
  /** 동기다. 성공/실패가 즉시 온다 (H35·H36) */
  sendRebuttal(caseId: string): Promise<void>;

  /* ── 실시간 ───────────────────────────────────────────── */
  subscribe(caseId: string, on: CaseEvents): () => void;
}
