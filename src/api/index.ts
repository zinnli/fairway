import type { CaseService } from './service';
import { mockService } from './mock';
import { httpService } from './http';

/**
 * 교체 지점은 여기 한 곳뿐이다.
 * VITE_API=http 면 백엔드로, 아니면 브라우저 안에서 도는 목으로 간다.
 * 목을 지우지 않는 이유 — 백엔드가 흔들려도 시연은 굴러가야 한다.
 */
export const service: CaseService =
  import.meta.env.VITE_API === 'http' ? httpService : mockService;

export type {
  ActiveJob,
  CaseDetail,
  CaseEvents,
  CaseService,
  Session,
  UploadResult,
} from './service';
export { ApiError, NetworkError, isApiError } from './http/error';
/** 401이 끝내 안 풀렸을 때 부를 곳을 라우터가 등록한다 */
export { setSessionLostHandler } from './http/client';
