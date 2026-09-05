import type {
  ActiveJob,
  CaseDetail,
  CaseEvents,
  CaseService,
  Session,
  UploadResult,
} from '../service';
import type { Case, CaseSummary, VideoRef } from '@/domain/case';
import type { ChatMessage } from '@/domain/message';
import type { Rebuttal, Statement } from '@/domain/document';
import type { Precedent, Verdict } from '@/domain/verdict';

import * as authApi from './endpoints/auth';
import * as casesApi from './endpoints/cases';
import * as messagesApi from './endpoints/messages';
import * as videosApi from './endpoints/videos';
import * as verdictApi from './endpoints/verdict';
import * as reportApi from './endpoints/report';
import * as rebuttalApi from './endpoints/rebuttal';
import { API_ORIGIN, downloadFile } from './client';
import { setToken } from './tokens';
import { subscribeCase } from './sse';
import type { CaseDto, JobDto, SessionDto } from './dto';
import {
  expandMessage,
  toCase,
  toCaseSummary,
  toMessage,
  toMessages,
  toRebuttal,
  toStatement,
  toVerdict,
  toVideoRef,
} from './map';

/**
 * 서비스 계층 — endpoints(전송)와 map(변환)을 엮어 CaseService를 만든다.
 * 여기서만 "무엇을 먼저 부르고 무엇을 이어 부르는지"를 안다.
 * 경로 문자열도, DTO 필드 이름도 이 파일에는 없다.
 */

const toSession = (s: SessionDto): Session => {
  setToken(s.accessToken);
  return { ...s.user };
};

const toActiveJob = (job: JobDto | null): ActiveJob | null =>
  job && (job.status === 'queued' || job.status === 'running') ? { kind: job.kind } : null;

/** 현황판이 쓰는 값은 비율뿐이다. 근거까지 필요하면 E-1을 따로 부른다 */
function caseWithRatio(c: CaseDto): Case {
  if (!c.verdict) return toCase(c, null);
  const ratio = { mine: c.verdict.ratio.mine, opponent: c.verdict.ratio.other };
  const lite: Verdict = {
    ratio,
    conclusion: '',
    chartName: '',
    chartNo: null,
    baseRatio: ratio,
    adjustments: [],
    precedents: [],
    createdAt: c.updatedAt,
  };
  return toCase(c, lite);
}

/**
 * 받아 온 파일을 저장한다.
 *
 * · 문서에 붙이지 않은 <a>는 Firefox에서 click이 먹지 않는다
 * · 브라우저가 blob을 다 읽기 전에 주소를 거두면 빈 파일이 떨어진다 — 한 박자 뒤에 거둔다
 */
function saveAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export const httpService: CaseService = {
  /* ── 인증 ─────────────────────────────────────────────── */

  login: async (email, password) => toSession(await authApi.login({ email, password })),

  signup: async (input) => toSession(await authApi.signup(input)),

  logout: async () => {
    await authApi.logout();
    setToken(null);
  },

  /**
   * 새로고침하면 액세스 토큰이 사라진다(메모리에만 두므로).
   * refresh 쿠키로 한 번 되살려 보고, 안 되면 로그인 화면으로 보낸다.
   */
  restoreSession: async () => {
    try {
      const { accessToken } = await authApi.refresh();
      setToken(accessToken);
      const user = await authApi.me();
      return { id: user.id, email: user.email, onboardedAt: user.onboardedAt, isDemo: user.isDemo };
    } catch {
      setToken(null);
      return null;
    }
  },

  isEmailAvailable: (email) => authApi.emailAvailable(email),

  getLegalDoc: async (docType) => {
    try {
      return (await authApi.legal(docType)).bodyMarkdown;
    } catch {
      /* 아직 안 올렸으면 화면이 아는 문구를 쓴다 — 빈 창을 띄우지 않는다 */
      return null;
    }
  },

  requestPasswordReset: async (email) => (await authApi.requestPasswordReset(email)).message,

  resetPassword: async (input) => (await authApi.confirmPasswordReset(input)).message,

  completeOnboarding: async (skipped) => {
    await authApi.completeOnboarding({ completed: !skipped, skipped });
  },

  /* ── 사건 ─────────────────────────────────────────────── */

  listCases: async (): Promise<CaseSummary[]> => (await casesApi.list()).items.map(toCaseSummary),

  getCase: async (caseId): Promise<CaseDetail> => {
    const dto = await casesApi.get(caseId);
    return { item: caseWithRatio(dto), activeJob: toActiveJob(dto.activeJob) };
  },

  createCase: async () => caseWithRatio(await casesApi.create()),

  renameCase: async (caseId, title) => {
    await casesApi.rename(caseId, title);
  },

  deleteCase: async (caseId) => {
    await casesApi.remove(caseId);
  },

  /* ── 대화 ─────────────────────────────────────────────── */

  listMessages: async (caseId): Promise<ChatMessage[]> =>
    toMessages((await messagesApi.list(caseId, { limit: 50 })).items),

  sendMessage: async (caseId, text) => {
    const { message } = await messagesApi.send(caseId, text);
    const mapped = toMessage(message);
    if (!mapped) throw new Error(`화면이 모르는 카드예요: ${message.type}`);
    return mapped;
  },

  uploadVideo: async (caseId, file, onProgress): Promise<UploadResult> => {
    const res = await videosApi.uploadToCase(caseId, file, onProgress);
    const video: VideoRef = {
      id: res.video.id,
      name: res.video.filename,
      sizeBytes: res.video.sizeBytes,
      sizeLabel: res.video.sizeLabel,
      durationSec: res.video.durationSec,
    };
    return {
      video,
      needsDescription: res.needsDescription,
      analysisStarted: res.analysis.started,
    };
  },

  /** 재생 주소는 10분이면 만료된다 — 뷰어를 열 때마다 새로 받는다 */
  getVideo: async (videoId) => {
    const dto = await videosApi.get(videoId);
    const video = toVideoRef(dto);
    return { ...video, streamUrl: `${API_ORIGIN}${dto.streamUrl}` };
  },

  /* ── 판정 ─────────────────────────────────────────────── */

  getVerdict: async (caseId): Promise<Verdict | null> => {
    const { verdict } = await verdictApi.get(caseId);
    return verdict ? toVerdict(verdict) : null;
  },

  getPrecedentText: async (caseId, precedent: Precedent) =>
    (await verdictApi.precedent(precedent.no, caseId)).bodyText,

  /* ── 사건경위서 ───────────────────────────────────────── */

  /** 202만 온다. 초안 카드는 SSE로 들어온다 */
  createStatement: async (caseId) => {
    await reportApi.create(caseId);
  },

  reviseStatement: async (caseId, request) => {
    await reportApi.revise(caseId, request);
  },

  getStatement: async (caseId): Promise<Statement> => toStatement(await reportApi.full(caseId)),

  /**
   * PDF는 서버가 만든다 — html2canvas로 그리지 않는다(한글이 이미지로 뭉개진다).
   * 인증이 필요해서 링크로 바로 열지 못하고, 받아서 저장한다 (F-5로 만들고 F-6으로 받는다).
   */
  downloadStatementPdf: async (caseId, version) => {
    const pdf = await reportApi.createPdf(caseId, version);
    saveAs(await downloadFile(`${API_ORIGIN}${pdf.downloadUrl}`), pdf.filename);
  },

  /* ── 반박의견서 ───────────────────────────────────────── */

  createRebuttal: async (caseId) => {
    await rebuttalApi.create(caseId);
  },

  getRebuttal: async (caseId): Promise<Rebuttal> => toRebuttal(await rebuttalApi.get(caseId)),

  updateRebuttal: async (caseId, patch) =>
    toRebuttal(
      /* 제목은 보내지 않는다 — 접수번호를 넣으면 서버가 다시 짓는다(subjectAuto).
         우리가 보내면 그 순간 자동 생성이 꺼진다 (명세 G-2·G-3) */
      await rebuttalApi.patch(caseId, {
        ...(patch.to !== undefined ? { recipient: patch.to } : {}),
        ...(patch.claimNo !== undefined ? { claimNumber: patch.claimNo ?? '' } : {}),
        ...(patch.body !== undefined ? { body: patch.body } : {}),
        ...(patch.attachments
          ? { attachments: patch.attachments.map((a) => ({ refId: a.id, included: a.included })) }
          : {}),
      }),
    ),

  /** 실패하면 ApiError가 그대로 올라간다 — 화면은 서버가 준 title·message를 띄운다 */
  sendRebuttal: async (caseId) => {
    await rebuttalApi.send(caseId);
  },

  /* ── 실시간 ───────────────────────────────────────────── */

  subscribe: (caseId, on: CaseEvents) =>
    subscribeCase(caseId, {
      messageCreated: (m) => {
        /* 발송 카드는 "다음 할 일"까지 둘로 갈라져 온다 */
        for (const mapped of expandMessage(m)) on.message?.(mapped);
      },
      messageUpdated: (m) => {
        const mapped = toMessage(m);
        if (mapped) on.messageUpdated?.(mapped);
      },
      caseUpdated: (c) => on.caseUpdated?.(caseWithRatio(c), toActiveJob(c.activeJob)),
      rebuttalSent: (d) => on.rebuttalSent?.(d.sentAt, d.recipient),
      lost: () => on.lost?.(),
    }),
};

export { ApiError, NetworkError, isApiError } from './error';
export { setSessionLostHandler } from './client';
