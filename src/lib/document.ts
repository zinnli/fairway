/** 서류 버전 이름 — h26·h30 */
const ORDINALS = ['첫', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];

export function versionLabel(version: number): string {
  const name = ORDINALS[version - 1];
  return name ? `${name} 번째 버전` : `${version}번째 버전`;
}
