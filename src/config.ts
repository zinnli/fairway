/**
 * 팀이 확정하지 않은 값은 전부 여기 모은다.
 * 결정이 뒤집혀도 화면을 건드리지 않는다.
 */

/** ★ 서비스 이름 미확정 (00 문서 5절). 로고·머리글·메일 제목이 전부 여기서 나온다. */
export const APP_NAME = '카-디펜더';

/** ★ 반박의견서 접수번호 필수 여부 (02 기능명세서 4.1). 8/27에 "필수"로 바뀌었으나 팀 확인 필요 */
export const REQUIRE_CLAIM_NO = true;

/** ★ 영상 제한 수치 미확정 (02 기능명세서 1.3) */
export const VIDEO_LIMITS = {
  maxBytes: 200 * 1024 * 1024,
  maxSeconds: 180,
  accept: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  acceptLabel: 'mp4 권장 (avi·mov 허용) · 최대 200MB · 3분',
} as const;

/**
 * 예시 영상 — 블랙박스가 없는 사람도 흐름을 끝까지 볼 수 있게 한다 (02 기능명세서 6.3, P0).
 * 파일은 `public/sample/`에 둔다. Vite가 손대지 않고 그대로 복사하므로 번들에 섞이지 않는다.
 * null로 두면 [예시 영상으로 해보기] 버튼이 화면에서 사라진다 — 파일이 아직 없으면 null.
 */
export const SAMPLE_VIDEO: { url: string; name: string } | null = null;
// 파일을 public/sample/에 넣는 날 아래로 되돌린다 (예시 영상은 별도 이슈)
// { url: '/sample/blackbox-sample.mp4', name: 'blackbox_sample.mp4' };

/** ★ 메일 실제 발송 여부 (02 기능명세서 4.3). 시연은 모의 발송 */
export const EMAIL_MODE: 'mock' | 'real' = 'mock';

/** 참고용 고지 — 규칙 0.2. 판정·서류가 보이는 곳 하단에 고정, 화면당 1회 */
export const DISCLAIMER =
  '본 결과는 참고용이며, 최종 과실비율은 보험사·분쟁심의위원회 결정에 따릅니다.';
