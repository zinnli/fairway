import type { IncomingMessage } from 'node:http';
import type {
  CaseDto,
  JobKindDto,
  MessageDto,
  MessagePayloadDto,
  MessageTypeDto,
  RebuttalDto,
} from '../../src/api/http/dto.ts';
import * as D from './data.ts';
import { fail, type Route } from './http.ts';
import { emit, emitLater, openStream } from './sse.ts';
import { cases, find, newId, now, sorted, touch, type CaseRow } from './state.ts';

/**
 * 목 백엔드의 몸통 — 명세 5장의 길들.
 *
 * 화면이 부르면 **진짜 HTTP로 답하고, 결과 카드는 SSE로 밀어 준다.**
 * 계약이 예전과 다른 두 가지를 여기서도 지킨다:
 * 분석·판정을 부르는 길이 없고(올리거나 보내면 서버가 돌린다),
 * 카드는 서버가 만든다(화면이 세우는 건 업로드 중·분석 중 두 장뿐).
 */

/* ── 세션 ──────────────────────────────────────────────────────────────── */

const USER = {
  id: '01JU1A2B3C4D5E6F7G8H9I0JKL',
  email: 'hyun@example.com',
  onboardedAt: null as string | null,
  isDemo: false,
};

/** 액세스 토큰 → 만료 시각. 만료되면 401을 주고, 화면은 refresh 한 번 뒤 다시 온다 */
const tokens = new Map<string, number>();
export const ACCESS_TTL_SEC = Number(process.env.DEV_API_MOCK_TTL ?? 1800);

function issueToken(): string {
  const token = `devmock.${newId()}`;
  tokens.set(token, Date.now() + ACCESS_TTL_SEC * 1000);
  return token;
}

export function authorize(req: IncomingMessage) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const until = token ? tokens.get(token) : undefined;
  if (!token || until === undefined) {
    throw fail(401, 'UNAUTHORIZED', '로그인이 필요해요', '다시 로그인해 주세요.', {
      actions: [{ label: '로그인하기', type: 'go_login' }],
    });
  }
  if (until < Date.now()) {
    tokens.delete(token);
    throw fail(401, 'TOKEN_EXPIRED', '로그인이 만료됐어요', '다시 로그인해 주세요.', {
      actions: [{ label: '로그인하기', type: 'go_login' }],
    });
  }
}

const session = (token: string) => ({ user: USER, accessToken: token, expiresIn: ACCESS_TTL_SEC });

/** refresh 쿠키 — 같은 출처(개발 프록시)라 SameSite=Lax로도 따라온다 */
function setRefreshCookie(ctxRes: { setHeader: (k: string, v: string) => void }) {
  ctxRes.setHeader(
    'Set-Cookie',
    `refresh_token=devmock-refresh; Path=/api/v1; HttpOnly; SameSite=Lax; Max-Age=1209600`,
  );
}

function hasRefreshCookie(req: IncomingMessage) {
  return (req.headers.cookie ?? '').includes('refresh_token=');
}

/* ── 카드 ──────────────────────────────────────────────────────────────── */

function card(
  row: CaseRow,
  role: 'user' | 'assistant',
  type: MessageTypeDto,
  payload: MessagePayloadDto,
): MessageDto {
  const message: MessageDto = {
    id: newId(),
    caseId: row.dto.id,
    role,
    type,
    payload,
    createdAt: now(),
  };
  row.messages.push(message);
  touch(row);
  return message;
}

const push = (row: CaseRow, message: MessageDto) => {
  emit(row.dto.id, 'message.created', message);
};

const caseUpdated = (row: CaseRow) => {
  touch(row);
  emit(row.dto.id, 'case.updated', row.dto);
};

function setJob(row: CaseRow, kind: JobKindDto | null) {
  row.dto.activeJob = kind ? { jobId: newId(), kind, status: 'running' } : null;
  caseUpdated(row);
  return row.dto.activeJob;
}

/* ── 사건 상태 ─────────────────────────────────────────────────────────── */

function afterAnalysis(row: CaseRow) {
  const c = row.dto;
  c.status = 'needs_review';
  c.statusLabel = '확인 필요';
  c.title = '교차로 직진 충돌 · 08-22';
  c.stages.analysis = { state: 'done' };
  c.facts = D.FACTS;
  push(row, card(row, 'assistant', 'text', { text: D.ANALYSIS_SUMMARY }));
  push(row, card(row, 'assistant', 'text', { text: D.QUESTIONS[0] }));
  /* 영상 카드의 meta는 분석 뒤에 채워 보낸다 (§4.4) */
  const video = row.messages.find((m) => m.type === 'video_attachment');
  if (video) {
    video.payload = { ...video.payload, meta: { speedKph: 48, impactAtSec: 31 } };
    emit(c.id, 'message.updated', video);
  }
  setJob(row, null);
}

function runVerdict(row: CaseRow) {
  setJob(row, 'verdict');
  emitLater(row.dto.id, 0, 'case.updated', row.dto);
  setTimeout(() => {
    const c = row.dto;
    c.status = 'judged';
    c.statusLabel = '판정 완료';
    c.stages.fault_ratio = { state: 'done' };
    c.verdict = { verdictId: D.VERDICT.verdictId, ratio: D.VERDICT.ratio };
    c.verdictPlaceholder = null;
    c.documents.rebuttal = {
      exists: false,
      locked: true,
      label: '잠김 · 경위서를 만들면 열려요',
    };
    push(row, card(row, 'assistant', 'verdict', D.VERDICT));
    setJob(row, null);
  }, 3000);
}

function startAnalysis(row: CaseRow) {
  row.dto.status = 'analyzing';
  row.dto.statusLabel = '분석중';
  row.dto.stages.analysis = { state: 'in_progress' };
  const job = setJob(row, 'analysis');
  setTimeout(() => afterAnalysis(row), 3500);
  return job;
}

const hasUserText = (row: CaseRow) =>
  row.messages.some((m) => m.role === 'user' && m.type === 'text');
const hasVideo = (row: CaseRow) => row.dto.video !== null;
const judged = (row: CaseRow) => row.dto.verdict !== null;

/* ── 길 ────────────────────────────────────────────────────────────────── */

export const routes: Route[] = [
  /* 5-A 인증 */
  {
    method: 'POST',
    path: '/auth/login',
    anonymous: true,
    handler: ({ body, res }) => {
      const input = body as { email?: string; password?: string };
      if (!input?.email || !input?.password) {
        throw fail(
          401,
          'AUTH_INVALID_CREDENTIALS',
          '로그인하지 못했어요',
          '이메일 또는 비밀번호가 맞지 않아요. 다시 입력해 주세요.',
          { fields: { password: '이메일 또는 비밀번호가 맞지 않아요.' } },
        );
      }
      USER.email = input.email;
      setRefreshCookie(res);
      return session(issueToken());
    },
  },
  {
    method: 'POST',
    path: '/auth/signup',
    anonymous: true,
    status: 201,
    handler: ({ body, res }) => {
      const input = body as { email?: string };
      if (input?.email) USER.email = input.email;
      USER.onboardedAt = null;
      setRefreshCookie(res);
      return session(issueToken());
    },
  },
  {
    method: 'POST',
    path: '/auth/demo',
    anonymous: true,
    handler: ({ res }) => {
      USER.isDemo = true;
      setRefreshCookie(res);
      return session(issueToken());
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    anonymous: true,
    handler: ({ req }) => {
      /* 쿠키가 없으면 진짜 세션 없음이다 — 화면은 로그인으로 보낸다 */
      if (!hasRefreshCookie(req)) {
        throw fail(401, 'UNAUTHORIZED', '로그인이 필요해요', '다시 로그인해 주세요.', {
      actions: [{ label: '로그인하기', type: 'go_login' }],
    });
      }
      return { accessToken: issueToken(), expiresIn: ACCESS_TTL_SEC };
    },
  },
  { method: 'GET', path: '/auth/me', handler: () => ({ ...USER, agreements: {} }) },
  {
    method: 'POST',
    path: '/auth/logout',
    status: 204,
    handler: ({ res }) => {
      tokens.clear();
      res.setHeader('Set-Cookie', 'refresh_token=; Path=/api/v1; Max-Age=0');
      return undefined;
    },
  },
  {
    method: 'GET',
    path: '/auth/email-available',
    anonymous: true,
    handler: ({ query }) => {
      /* 하나만 이미 쓰는 메일로 둔다 — 중복 안내를 눌러 볼 수 있게 */
      const taken = query.get('email') === 'taken@example.com';
      return {
        available: !taken,
        reason: taken ? '이미 가입된 이메일이에요. 로그인해 주세요.' : null,
      };
    },
  },
  {
    method: 'POST',
    path: '/auth/password-reset',
    anonymous: true,
    status: 202,
    handler: () => ({ message: '비밀번호 재설정 링크를 보냈어요. 메일함을 확인해 주세요.' }),
  },
  {
    method: 'POST',
    path: '/auth/password-reset/confirm',
    anonymous: true,
    handler: () => ({ message: '비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.' }),
  },
  {
    method: 'PATCH',
    path: '/users/me/onboarding',
    handler: () => {
      USER.onboardedAt = now();
      return { onboardedAt: USER.onboardedAt };
    },
  },
  {
    method: 'GET',
    path: '/legal/:docType',
    anonymous: true,
    handler: ({ params }) =>
      D.LEGAL[params.docType] ??
      (() => {
        throw fail(404, 'NOT_FOUND', '찾을 수 없어요', '삭제됐거나 주소가 잘못됐어요.');
      })(),
  },

  /* 5-B 사건 */
  {
    method: 'GET',
    path: '/cases',
    handler: () => ({
      items: sorted().map((r) => ({
        id: r.dto.id,
        title: r.dto.title,
        status: r.dto.status,
        statusLabel: r.dto.statusLabel,
        updatedAt: r.dto.updatedAt,
      })),
    }),
  },
  {
    method: 'POST',
    path: '/cases',
    status: 201,
    handler: () => {
      const id = newId();
      const dto = D.newCase(id, now());
      const row: CaseRow = {
        dto,
        messages: [],
        rebuttal: null,
        reportVersions: 0,
        sends: [],
        idempotency: new Map(),
      };
      cases.set(id, row);
      /* 접수 안내는 사건을 만들 때 서버가 넣는다 (§4.2) */
      card(row, 'assistant', 'guide', D.GUIDE);
      return dto;
    },
  },
  {
    method: 'GET',
    path: '/cases/:caseId',
    handler: ({ params }) => must(params.caseId).dto,
  },
  {
    method: 'PATCH',
    path: '/cases/:caseId',
    handler: ({ params, body }) => {
      const row = must(params.caseId);
      const title = (body as { title?: string })?.title?.trim();
      if (title) row.dto.title = title;
      caseUpdated(row);
      return row.dto;
    },
  },
  {
    method: 'DELETE',
    path: '/cases/:caseId',
    status: 204,
    handler: ({ params }) => {
      must(params.caseId);
      cases.delete(params.caseId);
      return undefined;
    },
  },

  /* 5-C 대화 */
  {
    method: 'GET',
    path: '/cases/:caseId/messages',
    handler: ({ params, query }) => {
      const row = must(params.caseId);
      const limit = Math.min(Number(query.get('limit') ?? 20) || 20, 100);
      const before = query.get('before');
      const at = before ? row.messages.findIndex((m) => m.id === before) : -1;
      const stop = at >= 0 ? at : row.messages.length;
      const start = Math.max(0, stop - limit);
      return {
        items: row.messages.slice(start, stop),
        hasMore: start > 0,
        nextCursor: start > 0 ? row.messages[start].id : null,
      };
    },
  },
  {
    method: 'POST',
    path: '/cases/:caseId/messages',
    status: 202,
    handler: ({ params, body }) => {
      const row = must(params.caseId);
      const text = (body as { text?: string })?.text?.trim() ?? '';
      if (!text) {
        throw fail(422, 'VALIDATION_FAILED', '보내지 못했어요', '내용을 적어 주세요.', {
          fields: { text: '내용을 적어 주세요.' },
        });
      }
      const mine = card(row, 'user', 'text', { text });
      /* 내가 친 글은 응답으로 돌려주고, 답은 SSE로 온다 (§4.1) */
      emit(row.dto.id, 'message.created', mine);

      if (hasVideo(row) && row.dto.stages.analysis.state === 'pending') {
        /* 영상은 있는데 설명이 없어 멈춰 있던 사건이다 — 이제 분석을 시작한다 (D-1 ⑤) */
        setTimeout(() => startAnalysis(row), 400);
      } else if (row.dto.stages.analysis.state === 'done' && !judged(row)) {
        /* 되물음에 답했다 — 판정으로 넘어간다 */
        setTimeout(() => runVerdict(row), 800);
      } else {
        emitLater(row.dto.id, 1200, 'message.created', {
          ...card(row, 'assistant', 'text', {
            text: '말씀 고마워요. 지금까지 나눈 이야기에 반영해 둘게요.',
          }),
        });
      }
      return { message: mine, assistantPending: true };
    },
  },

  /* 5-D 영상 */
  {
    method: 'POST',
    path: '/cases/:caseId/videos',
    status: 201,
    handler: ({ params, body }) => {
      const row = must(params.caseId);
      if (row.dto.activeJob) {
        throw fail(
          409,
          'JOB_ALREADY_RUNNING',
          '이미 진행 중이에요',
          '지금 하던 작업이 끝나면 다시 할 수 있어요.',
        );
      }
      const bytes = (body as { multipartBytes?: number })?.multipartBytes ?? 18_874_368;
      const videoId = newId();
      row.dto.video = {
        id: videoId,
        filename: 'blackbox_0822.mp4',
        durationSec: 42,
        sizeLabel: `${Math.max(1, Math.round(bytes / (1024 * 1024)))}MB`,
      };
      push(
        row,
        card(row, 'user', 'video_attachment', {
          videoId,
          filename: 'blackbox_0822.mp4',
          durationSec: 42,
          sizeLabel: row.dto.video.sizeLabel,
          recordedAt: '2026-08-22T14:02:17+09:00',
          meta: null,
        }),
      );

      const ready = hasUserText(row);
      const job = ready ? startAnalysis(row) : null;
      if (!ready) {
        /* 설명이 아직 없다 — 고정 문구를 한 장 보내고 기다린다 (D-1 ⑤) */
        emitLater(row.dto.id, 600, 'message.created', {
          ...card(row, 'assistant', 'text', { text: D.NEEDS_DESCRIPTION }),
        });
      }
      return D.uploadedVideo(videoId, 'blackbox_0822.mp4', bytes, job?.jobId ?? null, ready, !ready);
    },
  },
  {
    method: 'GET',
    path: '/videos/:videoId',
    handler: ({ params }) => {
      const row = [...cases.values()].find((r) => r.dto.video?.id === params.videoId);
      if (!row) throw fail(404, 'NOT_FOUND', '찾을 수 없어요', '없는 영상이에요.');
      return D.videoDetail(params.videoId, row.dto.id, row.dto.video!.filename);
    },
  },

  /* 5-E 판정 */
  {
    method: 'GET',
    path: '/cases/:caseId/verdict',
    handler: ({ params }) => {
      const row = must(params.caseId);
      return judged(row)
        ? { verdict: D.VERDICT, placeholder: null }
        : { verdict: null, placeholder: '아직 판정 전이에요.' };
    },
  },
  {
    method: 'GET',
    path: '/precedents/:precedentId',
    handler: ({ params }) =>
      D.PRECEDENTS[params.precedentId] ??
      (() => {
        throw fail(404, 'NOT_FOUND', '찾을 수 없어요', '없는 심의사례예요.');
      })(),
  },

  /* 5-F 사건경위서 */
  {
    method: 'POST',
    path: '/cases/:caseId/report',
    status: 202,
    handler: ({ params }) => {
      const row = must(params.caseId);
      if (!judged(row)) {
        throw fail(
          409,
          'REPORT_VERDICT_REQUIRED',
          '아직 만들 수 없어요',
          '과실비율 판정이 끝나면 경위서를 만들 수 있어요.',
        );
      }
      running(row);
      const job = setJob(row, 'report')!;
      row.dto.stages.report = { state: 'in_progress' };
      setTimeout(() => {
        row.reportVersions = 1;
        row.dto.stages.report = { state: 'done' };
        row.dto.documents.report = {
          exists: true,
          label: '첫 번째 버전 · 2장',
          version: 1,
          pageCount: 2,
        };
        row.dto.documents.rebuttal = { exists: false, locked: false, label: '이제 만들 수 있어요' };
        push(row, card(row, 'assistant', 'report_draft', D.REPORT_DRAFT));
        setJob(row, null);
      }, 2500);
      return { ...job, version: 1 };
    },
  },
  {
    method: 'GET',
    path: '/cases/:caseId/report/versions',
    handler: ({ params }) => {
      const row = must(params.caseId);
      return {
        items: Array.from({ length: row.reportVersions }, (_, i) => ({
          version: i + 1,
          versionLabel: i === 0 ? '첫 번째 버전' : `${i + 1}번째 버전`,
          pageCount: 2,
          revisionRequest: null,
          hasPdf: false,
          createdAt: now(),
        })),
        latestVersion: row.reportVersions,
      };
    },
  },
  {
    method: 'GET',
    path: '/cases/:caseId/report/versions/:version',
    handler: ({ params }) => {
      const row = must(params.caseId);
      if (!row.reportVersions) {
        throw fail(404, 'NOT_FOUND', '찾을 수 없어요', '아직 경위서가 없어요.');
      }
      const v = params.version === 'latest' ? row.reportVersions : Number(params.version);
      return D.reportFull(v);
    },
  },
  {
    method: 'POST',
    path: '/cases/:caseId/report/revisions',
    status: 202,
    handler: ({ params }) => {
      const row = must(params.caseId);
      running(row);
      const job = setJob(row, 'report')!;
      const from = row.reportVersions;
      setTimeout(() => {
        row.reportVersions = from + 1;
        row.dto.documents.report = {
          exists: true,
          label: `${row.reportVersions}번째 버전 · 2장`,
          version: row.reportVersions,
          pageCount: 2,
        };
        /* 다시 쓰기는 카드를 새로 만들지 않고 있던 카드를 고쳐 보낸다 (F-4) */
        const draft = [...row.messages].reverse().find((m) => m.type === 'report_draft');
        if (draft) {
          draft.payload = {
            ...D.REPORT_DRAFT,
            version: row.reportVersions,
            versionLabel: `${row.reportVersions}번째 버전`,
          };
          emit(row.dto.id, 'message.updated', draft);
        }
        setJob(row, null);
      }, 2500);
      return { ...job, fromVersion: from, toVersion: from + 1 };
    },
  },
  {
    method: 'POST',
    path: '/cases/:caseId/report/versions/:version/pdf',
    handler: ({ params }) => {
      const row = must(params.caseId);
      return {
        pdfId: newId(),
        version: Number(params.version) || row.reportVersions,
        filename: '사건경위서.pdf',
        sizeBytes: 184320,
        downloadUrl: `/api/v1/cases/${row.dto.id}/report/versions/${row.reportVersions}/pdf?t=devmock`,
        createdAt: now(),
      };
    },
  },

  /* 5-G 반박의견서 */
  {
    method: 'POST',
    path: '/cases/:caseId/rebuttal',
    status: 202,
    handler: ({ params }) => {
      const row = must(params.caseId);
      /* 잠금 조건은 서버가 검사한다 (G-1) — 판정과 경위서가 있어야 한다.
         채팅으로 청했을 때만 오류 대신 rebuttal_locked 카드가 간다 */
      const missing = [!judged(row) && 'verdict', !row.reportVersions && 'report'].filter(
        Boolean,
      ) as string[];
      if (missing.length) {
        throw fail(
          409,
          'REBUTTAL_LOCKED',
          '아직 보낼 수 없어요',
          '반박의견서에는 사건경위서가 첨부돼요. 먼저 경위서를 만들면 보낼 수 있어요.',
          {
            actions: [{ label: '사건경위서 먼저 만들기', type: 'create_report' }],
            fields: { missing: missing.join(',') },
          },
        );
      }
      running(row);
      const job = setJob(row, 'rebuttal')!;
      setTimeout(() => {
        row.rebuttal = D.newRebuttal(newId());
        row.dto.stages.rebuttal = { state: 'in_progress' };
        row.dto.documents.rebuttal = { exists: true, locked: false, label: '작성 중' };
        push(row, card(row, 'assistant', 'rebuttal_draft', draftPayload(row.rebuttal)));
        setJob(row, null);
      }, 2500);
      return job;
    },
  },
  {
    method: 'GET',
    path: '/cases/:caseId/rebuttal',
    handler: ({ params }) => {
      const row = must(params.caseId);
      if (!row.rebuttal) throw fail(404, 'NOT_FOUND', '찾을 수 없어요', '아직 초안이 없어요.');
      return row.rebuttal;
    },
  },
  {
    method: 'PATCH',
    path: '/cases/:caseId/rebuttal',
    handler: ({ params, body }) => {
      const row = must(params.caseId);
      if (!row.rebuttal) throw fail(404, 'NOT_FOUND', '찾을 수 없어요', '아직 초안이 없어요.');
      if (row.rebuttal.status === 'sent') {
        throw fail(409, 'REBUTTAL_ALREADY_SENT', '이미 보냈어요', '보낸 문서는 고칠 수 없어요.');
      }
      const patch = body as Partial<RebuttalDto> & {
        attachments?: { refId: string; included: boolean }[];
      };
      const doc = row.rebuttal;
      if (patch.recipient !== undefined) doc.recipient = patch.recipient;
      if (patch.claimNumber !== undefined) doc.claimNumber = patch.claimNumber;
      if (patch.body !== undefined) doc.body = patch.body;
      if (patch.subject !== undefined) {
        doc.subject = patch.subject;
        doc.subjectAuto = false;
      } else if (doc.subjectAuto) {
        /* 접수번호가 바뀌면 제목은 서버가 다시 만든다 (G-2) */
        doc.subject = D.autoSubject(doc.claimNumber);
      }
      if (patch.attachments) {
        for (const a of patch.attachments) {
          const found = doc.attachments.find((x) => x.refId === a.refId);
          if (found) found.included = a.included;
        }
      }
      const blocked: string[] = [];
      if (!doc.recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doc.recipient)) {
        blocked.push('recipient');
      }
      if (!doc.claimNumber?.trim()) blocked.push('claimNumber');
      doc.blockedBy = blocked;
      doc.canSend = blocked.length === 0;
      touch(row);
      return doc;
    },
  },
  {
    method: 'POST',
    path: '/cases/:caseId/rebuttal/send',
    handler: ({ params, req }) => {
      const row = must(params.caseId);
      const key = req.headers['idempotency-key'];
      if (typeof key !== 'string' || !key) {
        throw fail(
          400,
          'IDEMPOTENCY_KEY_REQUIRED',
          '요청을 처리하지 못했어요',
          '잠시 후 다시 시도해 주세요.',
        );
      }
      const before = row.idempotency.get(key);
      /* 같은 키로 다시 오면 처음 준 답을 그대로 돌려준다 — 메일은 다시 나가지 않는다 (§2.5) */
      if (before) return before;

      const doc = row.rebuttal;
      if (!doc) throw fail(404, 'NOT_FOUND', '찾을 수 없어요', '아직 초안이 없어요.');
      if (doc.status === 'sent') {
        throw fail(409, 'REBUTTAL_ALREADY_SENT', '이미 보냈어요', '이 문서는 이미 보냈어요.');
      }
      if (!doc.recipient) {
        throw fail(422, 'RECIPIENT_INVALID', '보내지 못했어요', '받는 사람 주소를 확인해 주세요.', {
          fields: { recipient: '이메일 주소를 확인해 주세요.' },
        });
      }
      if (!doc.claimNumber?.trim()) {
        throw fail(422, 'CLAIM_NUMBER_REQUIRED', '보내지 못했어요', '접수번호를 넣어 주세요.', {
          fields: { claimNumber: '접수번호를 넣어 주세요.' },
        });
      }

      const attached = doc.attachments.filter((a) => a.included);
      const sendLogId = newId();
      const sentAt = now();
      doc.status = 'sent';
      doc.editable = false;
      row.sends.unshift({
        sendLogId,
        sentAt,
        fromEmail: doc.fromEmail,
        recipient: doc.recipient,
        subject: doc.subject,
        attachmentCount: attached.length,
        attachmentNames: attached.map((a) => a.name),
        result: 'delivered',
      });
      row.dto.status = 'sent';
      row.dto.statusLabel = '발송 완료';
      row.dto.stages.rebuttal = { state: 'done' };
      row.dto.documents.rebuttal = {
        exists: true,
        locked: false,
        label: `발송 완료 · ${sentAt.slice(5, 10)} ${sentAt.slice(11, 16)}`,
      };
      /* 순서까지 명세대로 — sent 카드 → rebuttal.sent → case.updated (G-4) */
      push(row, card(row, 'assistant', 'sent', D.sentPayload(sendLogId, sentAt, doc.recipient, attached.length)));
      emit(row.dto.id, 'rebuttal.sent', { sendLogId, sentAt, recipient: doc.recipient });
      caseUpdated(row);

      const result = {
        sendLogId,
        status: 'queued',
        fromEmail: doc.fromEmail,
        recipient: doc.recipient,
        attachmentCount: attached.length,
      };
      row.idempotency.set(key, result);
      return result;
    },
  },
  {
    method: 'GET',
    path: '/cases/:caseId/rebuttal/sends',
    handler: ({ params }) => ({ items: must(params.caseId).sends }),
  },

  /* 5-§6 실시간 채널 · 5-H 시스템 */
  {
    method: 'GET',
    path: '/cases/:caseId/events',
    raw: true,
    /* EventSource는 헤더를 못 붙여서 토큰이 쿼리로 온다 — 여기서 직접 본다 */
    anonymous: true,
    handler: ({ params, req, res }) => {
      must(params.caseId);
      openStream(params.caseId, req, res);
    },
  },
  {
    method: 'GET',
    path: '/health',
    anonymous: true,
    handler: () => ({
      status: 'ok',
      version: '2.0.0-devmock',
      checks: { db: 'ok', storage: 'ok', agent: 'ok', mail: 'ok' },
    }),
  },
];

/* ── 거들이 ────────────────────────────────────────────────────────────── */

function must(caseId: string): CaseRow {
  const row = find(caseId);
  if (!row) throw fail(404, 'NOT_FOUND', '찾을 수 없어요', '없는 사건이에요.');
  return row;
}

/** 이미 도는 일이 있으면 새 일을 받지 않는다 (§2.6 · JOB_ALREADY_RUNNING) */
function running(row: CaseRow) {
  if (!row.dto.activeJob) return;
  throw fail(
    409,
    'JOB_ALREADY_RUNNING',
    '이미 진행 중이에요',
    '지금 하던 작업이 끝나면 다시 할 수 있어요.',
  );
}

/** 초안 카드(§4.8)는 조회(G-2)와 담는 것이 조금 다르다 — 본문은 미리보기만 간다 */
function draftPayload(doc: RebuttalDto) {
  return {
    rebuttalId: doc.rebuttalId,
    recipient: doc.recipient,
    recipientPlaceholder: '담당자 이메일',
    claimNumber: doc.claimNumber,
    claimNumberHint: doc.claimNumberHint,
    subject: doc.subject,
    bodyPreview: `${doc.body.split('\n').find((l) => l.trim() && !l.startsWith('담당자')) ?? doc.body} …`,
    attachments: doc.attachments,
    attachmentNotice: doc.attachmentNotice,
    canSend: doc.canSend,
    blockedBy: doc.blockedBy,
  };
}

/** 대화가 길 때의 화면과 페이지 나눔(C-1)을 네트워크로도 확인할 수 있게 채워 둔다 */
const CHITCHAT: [string, string][] = [
  ['사고 접수는 언제까지 하면 되나요?', '보험사마다 다르지만 사고 뒤 되도록 빨리 접수하는 편이 좋아요.'],
  ['상대가 신호를 지켰다고 우겨요.', '영상에 신호 상태가 담겨 있으면 그 주장은 힘을 잃어요.'],
  ['보험사에서 3 대 7이라고 하던데요.', '상대 보험사가 제시한 비율을 알려 주시면 판정과 나란히 견주어 드릴게요.'],
  ['수리비는 누가 내나요?', '과실비율에 따라 나눠 부담해요.'],
  ['블랙박스 화질이 안 좋아도 되나요?', '번호판까지 또렷하지 않아도 신호와 진행 방향이 보이면 분석에 씁니다.'],
  ['합의를 먼저 하자고 연락이 왔어요.', '비율을 확인하기 전에 서둘러 합의하면 되돌리기 어려워요.'],
  ['분쟁심의위원회는 어떻게 가나요?', '내 보험사에 심의 청구를 요청하는 방법으로 갑니다.'],
];

/** 처음 띄울 때 사건 하나를 넣어 둔다 — 목록이 비어 있으면 볼 것이 없다 */
export function seed() {
  const id = newId();
  const dto: CaseDto = D.newCase(id, new Date(Date.now() - 3600_000).toISOString());
  const row: CaseRow = {
    dto,
    messages: [],
    rebuttal: null,
    reportVersions: 0,
    sends: [],
    idempotency: new Map(),
  };
  cases.set(id, row);
  card(row, 'assistant', 'guide', D.GUIDE);
  /* 한 쪽(20장)을 훌쩍 넘겨 둔다 — `hasMore`·`nextCursor`가 실제로 돌아야 위로 올려서 보기를 볼 수 있다 */
  for (let round = 0; round < 5; round += 1) {
    for (const [mine, reply] of CHITCHAT) {
      card(row, 'user', 'text', { text: round === 0 ? mine : `${mine} (${round + 1}번째로 여쭤요)` });
      card(row, 'assistant', 'text', { text: reply });
    }
  }
  return row;
}
