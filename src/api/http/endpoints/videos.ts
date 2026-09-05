import { request, upload } from '../client';
import type { VideoDto, VideoUploadedDto } from '../dto';

/** 5-D 영상. 서버 경유 멀티파트 1단계 (§8.2) */

export const uploadToCase = (
  caseId: string,
  file: File,
  onProgress: (percent: number) => void,
) => upload<VideoUploadedDto>(`/cases/${caseId}/videos`, file, onProgress);

/** streamUrl은 서명 토큰이 붙어 있고 10분이면 만료된다 — 만료되면 다시 부른다 */
export const get = (videoId: string) => request<VideoDto>(`/videos/${videoId}`);
