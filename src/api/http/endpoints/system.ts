import { request } from '../client';

/** 5-H 시스템 */
export const health = () =>
  request<{ status: string; version: string; checks: Record<string, string> }>('/health', {
    anonymous: true,
  });
