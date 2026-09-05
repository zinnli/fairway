/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 기본 주소. 끝에 /api/v1까지 붙인다 — 빼먹으면 404가 난다 */
  readonly VITE_API_BASE?: string;
  /** mock | http */
  readonly VITE_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
