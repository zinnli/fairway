import type {
  CaseDto,
  GuidePayloadDto,
  LegalDocDto,
  PrecedentDto,
  RebuttalDto,
  ReportDraftPayloadDto,
  ReportFullDto,
  SentPayloadDto,
  VerdictPayloadDto,
  VideoDto,
  VideoUploadedDto,
} from '../../src/api/http/dto.ts';

/**
 * 목 백엔드가 내려보내는 알맹이 — **명세(05_API_명세서.md)의 예시 그대로다.**
 * 문구를 다듬지 않는다. 여기서 손대면 화면이 서버에서 받게 될 글과 달라져서,
 * 네트워크 탭을 보는 뜻이 없어진다.
 */

export const DISCLAIMER =
  '본 결과는 참고용이며, 최종 과실비율은 보험사·분쟁심의위원회 결정에 따릅니다.';

export const GUIDE: GuidePayloadDto = {
  text: '안녕하세요, FAIRWAY예요. 사고 상황을 말로 설명하고, 블랙박스 영상을 올려 주세요. 둘이 모이면 분석이 자동으로 시작돼요.',
  notice: '영상은 이 사건 처리에만 쓰이며, 사건을 지우면 함께 지워집니다.',
  limitsLabel: 'mp4 권장 · 최대 200MB · 3분 이내',
};

/** D-1 ⑤ — 설명 없이 영상만 올렸을 때 (백엔드 고정 문구) */
export const NEEDS_DESCRIPTION =
  '영상 잘 받았어요. 사고 상황을 한두 문장으로 알려 주시면 바로 분석을 시작할게요.';

/** 분석이 끝나고 오는 요약 (§4.1 예시) */
export const ANALYSIS_SUMMARY =
  '영상을 분석했어요. 내 차는 2차로에서 직진 중이었고, 상대는 우측에서 적색 신호에 진입했어요. 내 속도는 약 48km/h예요. 충돌 부위와 정지선 통과 시점은 영상만으로는 확인이 어려워요.';

export const QUESTIONS = [
  '상대 차량과 부딪힌 곳이 어디인가요? 1/2',
  '교차로에 들어설 때 신호가 언제 바뀌었는지 기억하시나요? 2/2',
];

export const VERDICT: VerdictPayloadDto = {
  verdictId: '01JF7Q5N1S6T0V4W8X2Y5Z9ABC',
  version: 1,
  changeReason: null,
  ratio: { mine: 0, other: 100 },
  summary:
    '상대 신호위반 일방과실이에요. 내 차가 미리 알아차리거나 피할 수 없었던 것으로 판단돼요.',
  opponentClaim: null,
  /* 주장이 없을 때도 문장은 늘 온다 (9/6 수정요청) */
  opponentClaimNote:
    '상대 보험사가 제시한 과실비율은 아직 없어요. 채팅으로 알려주시면 판정과 나란히 비교해 드릴게요.',
  basis: {
    chart: {
      /* 도표 번호는 이름 앞머리에 실려 온다 (9/6) */
      name: '266 · 신호기 있는 교차로 · 신호위반',
      note: '사고 유형별 기본 비율을 정해 둔 표 · 차대이륜차 편',
    },
    precedents: [
      { id: '2019-018856', title: '신호위반 직진 충돌' },
      { id: '2021-004312', title: '이륜차 교차로 진입' },
    ],
  },
  canCreateReport: true,
  disclaimer: DISCLAIMER,
};

export const PRECEDENTS: Record<string, PrecedentDto> = {
  '2019-018856': {
    precedentId: '2019-018856',
    title: '신호위반 직진 충돌',
    bodyText:
      '사례 내용\n\n신호기가 있는 교차로에서 직진하던 승용차와, 반대편에서 적색 신호에 진입한 이륜차가 충돌한 사고예요.\n\n판정에서의 역할\n\n적색 신호 진입이 영상으로 확인되면 신호위반 측의 일방과실로 본 사례예요.\n\n내 사건과의 관계\n\n상대 차량의 적색 신호 진입이 영상에 담겨 있어 이 사례와 사고 모습이 거의 같아요.',
    imageUrl: null,
    imageCaption: null,
  },
  '2021-004312': {
    precedentId: '2021-004312',
    title: '이륜차 교차로 진입',
    bodyText:
      '사례 내용\n\n이륜차가 교차로에 진입하며 직진 차량과 충돌한 사고예요.\n\n판정에서의 역할\n\n이륜차라는 이유만으로 과실을 덜어 주지는 않는다고 본 사례예요.\n\n내 사건과의 관계\n\n상대가 이륜차인 점이 같아, 기본 비율을 정할 때 함께 살폈어요.',
    imageUrl: null,
    imageCaption: null,
  },
};

export const REPORT_DRAFT: ReportDraftPayloadDto = {
  reportId: '01JH0T8R4V9X3Y7Z1A5B8CDEFG',
  version: 1,
  versionLabel: '첫 번째 버전',
  pageCount: 2,
  preview: [
    '1. 사고 일시 및 장소 — 2026년 8월 22일 14시경, 서울시 강남구 논현사거리 …',
    '2. 사고 경위 — 본인은 2차로에서 정상 신호에 따라 직진 중 …',
  ],
  caveat: '정지선 통과 시점 한 가지는 아직 확인 중이에요.',
  canCreateRebuttal: true,
};

export const reportFull = (version: number): ReportFullDto => ({
  reportId: REPORT_DRAFT.reportId,
  version,
  versionLabel: version === 1 ? '첫 번째 버전' : `${version}번째 버전`,
  dateLabel: '08-25',
  pageCount: 2,
  intro: '채팅에서 나눈 대화와 영상 분석 결과를 바탕으로 쓴 첫 번째 버전이에요.',
  sections: [
    {
      index: 1,
      title: '사고 일시 및 장소',
      body: '2026년 8월 22일 14시경, 서울시 강남구 논현사거리에서 사고가 났습니다.',
    },
    {
      index: 2,
      title: '사고 경위',
      body: '본인은 2차로에서 정상 신호에 따라 직진 중이었고, 상대 이륜차가 우측에서 적색 신호에 교차로로 진입해 충돌했습니다.',
    },
    {
      index: 3,
      title: '영상 분석 결과',
      body: '블랙박스 영상에서 상대 차량의 적색 신호 진입과 본인 차량의 정상 신호 직진이 확인됩니다.',
    },
    {
      index: 4,
      title: '주장 요지',
      body: '상대 차량이 적색 신호에 교차로에 들어와 생긴 사고이므로, 상대 차량의 일방과실 적용을 요청드립니다.',
    },
  ],
  revisionPlaceholder: '예: 2번을 더 간단하게',
  disclaimer: DISCLAIMER,
});

/** 반박의견서 제목은 서버가 접수번호로 만든다 (G-2 `subjectAuto`) */
export const autoSubject = (claimNumber: string | null) =>
  claimNumber?.trim()
    ? `과실비율 재검토 요청 (접수번호 ${claimNumber.trim()})`
    : '과실비율 재검토 요청 (접수번호는 아직 안 넣었어요)';

export const newRebuttal = (rebuttalId: string): RebuttalDto => ({
  rebuttalId,
  status: 'draft',
  recipient: null,
  claimNumber: null,
  claimNumberHint: '보험사 접수 문자나 메일에 있어요',
  subject: autoSubject(null),
  subjectAuto: true,
  body: '담당자님께,\n\n1. 주장하는 과실비율\n귀사는 나 30 : 상대 70을 제시하셨습니다. 블랙박스 영상에서 상대 차량의 적색 신호 진입이 확인됩니다.\n\n2. 근거\n인정기준 도표(신호기 있는 교차로 · 신호위반)와 심의사례 2019-018856 · 2021-004312에 비추어 나 0 : 상대 100이 타당합니다.\n\n감사합니다.',
  attachments: [
    {
      kind: 'report_pdf',
      refId: '01JO7A5Y1C6E0F4G8H2I5JKLMN',
      name: '사건경위서.pdf',
      sizeBytes: 184320,
      included: true,
      note: null,
    },
    {
      kind: 'video',
      refId: '01JC5N3L9Q4R8S2T6V0W3X7YZA',
      name: 'blackbox_0822.mp4',
      sizeBytes: 18874368,
      included: true,
      note: null,
    },
  ],
  attachmentNotice:
    '영상에는 상대 차량 번호판 등 다른 사람의 정보가 담길 수 있어요. 보험사 담당자에게만 보내 주세요. ×를 누르면 빼고 보낼 수 있어요.',
  fromEmail: 'hyun@example.com',
  canSend: false,
  blockedBy: ['recipient', 'claimNumber'],
  editable: true,
});

export const REBUTTAL_LOCKED = {
  text: '반박의견서에는 사건경위서가 첨부돼요. 먼저 경위서를 만들면 보낼 수 있어요.',
  missing: ['report'] as ('verdict' | 'report')[],
  buttonLabel: '반박의견서 보내기',
  buttonHint: '경위서를 만들면 열려요',
};

export const sentPayload = (
  sendLogId: string,
  sentAt: string,
  recipient: string,
  attachmentCount: number,
): SentPayloadDto => ({
  sendLogId,
  sentAt,
  recipient,
  attachmentCount,
  notice: '보낸 문서는 그대로 보관되고 수정할 수 없어요. 다시 보내려면 새 문서로 만들어요.',
  nextSteps: [
    '보험사 회신을 기다려요 (보통 3~7일)',
    '회신이 오면 채팅에 붙여넣어 주세요 — 함께 따져 볼게요',
    '받아들여지지 않으면 내 보험사에 분쟁심의 청구를 요청하는 방법을 안내해 드려요',
  ],
});

export const uploadedVideo = (
  videoId: string,
  filename: string,
  sizeBytes: number,
  jobId: string | null,
  started: boolean,
  needsDescription: boolean,
): VideoUploadedDto => ({
  video: {
    id: videoId,
    filename,
    sizeBytes,
    sizeLabel: `${Math.max(1, Math.round(sizeBytes / (1024 * 1024)))}MB`,
    durationSec: 42,
    mimeType: 'video/mp4',
    recordedAt: '2026-08-22T14:02:17+09:00',
  },
  analysis: { started, jobId },
  needsDescription,
});

export const videoDetail = (videoId: string, caseId: string, filename: string): VideoDto => ({
  id: videoId,
  caseId,
  filename,
  sizeLabel: '18MB',
  durationSec: 42,
  durationLabel: '42초',
  recordedAt: '2026-08-22T14:02:17+09:00',
  meta: { speedKph: 48, impactAtSec: 31, impactLabel: '충돌 시점으로 이동 (0:31)' },
  /* 서명 토큰이 붙은 상대 주소. 목은 개발 서버가 들고 있는 표본 영상을 가리킨다 */
  streamUrl: `/api/v1/videos/${videoId}/stream?t=devmock`,
  notice: '영상은 이 사건 처리에만 쓰여요.',
});

export const LEGAL: Record<string, LegalDocDto> = {
  terms: {
    docType: 'terms',
    title: '이용약관',
    version: '1.0',
    bodyMarkdown: '# 이용약관\n\n개발용 목 서버가 내려보내는 본문이에요.',
  },
  privacy: {
    docType: 'privacy',
    title: '개인정보 처리방침',
    version: '1.0',
    bodyMarkdown: '# 개인정보 처리방침\n\n개발용 목 서버가 내려보내는 본문이에요.',
  },
  'video-consent': {
    docType: 'video-consent',
    title: '영상 이용 동의',
    version: '1.0',
    bodyMarkdown: '# 영상 이용 동의\n\n개발용 목 서버가 내려보내는 본문이에요.',
  },
};

/** 갓 만든 사건 (B-2). 상태·라벨은 전부 서버가 정해서 내려보낸다 */
export const newCase = (id: string, createdAt: string): CaseDto => ({
  id,
  title: '새 사건',
  status: 'intake',
  statusLabel: '접수중',
  subtitle: `접수 ${createdAt.slice(5, 10).replace('-', '-')}`,
  stages: {
    analysis: { state: 'pending' },
    fault_ratio: { state: 'pending' },
    report: { state: 'pending' },
    rebuttal: { state: 'pending' },
  },
  verdict: null,
  verdictPlaceholder: '아직 판정 전이에요.',
  documents: {
    report: { exists: false, label: '아직 없음', version: null, pageCount: null },
    rebuttal: { exists: false, locked: true, label: '잠김 · 판정과 경위서가 먼저예요' },
  },
  video: null,
  facts: null,
  activeJob: null,
  disclaimer: DISCLAIMER,
  createdAt,
  updatedAt: createdAt,
});

/** 분석이 끝나면 붙는 확인된 사실 (9/6 되살림) */
export const FACTS = {
  confirmed: 5,
  total: 6,
  label: '확인된 사실 5 / 6 · 남은 1개는 쟁점이에요',
  items: [
    { label: '신호기 있는 교차로', source: 'video' as const, field: 'road.road_type' },
    { label: '2차로 직진', source: 'video' as const, field: 'ego_vehicle.movement' },
    { label: '상대 적색 신호 진입', source: 'video' as const, field: 'other_vehicle.signal' },
    { label: '약 48km/h', source: 'video' as const, field: 'ego_vehicle.speed' },
    { label: '우측 앞펜더 충돌', source: 'user' as const, field: 'impact.point' },
    { label: '정지선 통과 시점', source: 'pending' as const, field: null },
  ],
};
