import type { Api } from './types';
import { mockApi } from './mock';

/**
 * 교체 지점은 여기 한 곳뿐이다.
 * 백엔드가 붙으면: VITE_API=http 로 두고 아래 주석을 푼다.
 */
// import { httpApi } from './http';
export const api: Api = mockApi;
// export const api: Api = import.meta.env.VITE_API === 'http' ? httpApi : mockApi;

export type { Api } from './types';
export type { AnalyzeEvent } from './types';
