/** 서류 버전 이름 — h26·h30 */
export function versionLabel(version: number): string {
  if (version === 1) return '첫 번째 버전';
  if (version === 2) return '두 번째 버전';
  return `${version}번째 버전`;
}
