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
 *
 * 브라우저는 폴더를 훑어볼 수 없다 — **영상을 넣을 때 여기에 한 줄도 같이 넣는다.**
 * 빈 배열이면 [샘플 영상 올리기] 단추가 화면에서 사라진다.
 *
 * 목록에 보이는 이름도, 올린 뒤 말풍선에 붙는 이름도 이 파일 이름 그대로다.
 */
export const SAMPLE_VIDEOS: string[] = [
  'bb_1_200514_vehicle_141_062.mp4',
  'bb_1_220804_vehicle_116_067.mp4',
  'cc_3_200203_vehicle_311_029.mp4',
];

/** 예시 영상이 놓인 자리 */
export const sampleVideoUrl = (file: string) => `/sample/${file}`;

/** ★ 메일 실제 발송 여부 (02 기능명세서 4.3). 시연은 모의 발송 */
export const EMAIL_MODE: 'mock' | 'real' = 'mock';

/** 참고용 고지 — 규칙 0.2. 판정·서류가 보이는 곳 하단에 고정, 화면당 1회 */
export const DISCLAIMER =
  '본 결과는 참고용이며, 최종 과실비율은 보험사·분쟁심의위원회 결정에 따릅니다.';
