import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { APP_NAME } from './src/config.ts';
import { mockApi } from './dev/mockApi.ts';

/** 서비스 이름이 미확정이라 index.html에 박지 않는다. %APP_NAME%을 빌드 시 치환한다. */
const appName = (): Plugin => ({
  name: 'app-name-html',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replaceAll('%APP_NAME%', APP_NAME),
  },
});

/**
 * 개발 서버에서만 도는 API 중계.
 *
 * 서버가 refresh 쿠키를 `SameSite=lax`로 내리는데, `localhost:5173`에서 `api.…`를 직접 부르면
 * 브라우저가 **다른 사이트**로 보고(`sec-fetch-site: cross-site`) 그 쿠키를 보내지 않는다.
 * 그래서 새로고침하면 세션이 되살아나지 못하고 로그인 화면으로 튕긴다.
 *
 * 배포에서는 `fairway.click` ↔ `api.fairway.click`이 같은 사이트라 그냥 된다 —
 * 로컬만 어긋나는 것이므로, 서버 쿠키 설정을 느슨하게 만들지 않고 **주소를 같은 출처로 만든다.**
 *
 * 쓰려면 `.env.local`에 세 줄:
 *   VITE_API=http
 *   VITE_API_BASE=/api/v1          ← 상대 주소. 브라우저에는 같은 출처로 보인다
 *   DEV_API_PROXY=https://…        ← 실제 API 주소 (저장소에 넣지 않는다)
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  /**
   * 목 백엔드를 개발 서버 안에 붙인다 (`DEV_API_MOCK=1`).
   * 브라우저 목(`VITE_API=mock`)과 달리 **진짜 HTTP로 답해서** 네트워크 탭에 찍힌다 —
   * 전송 계층과 DTO 매핑을 함께 태워 보려는 것이라, 켜면 `VITE_API=http`로 둔다.
   * 진짜 서버 중계(DEV_API_PROXY)와 겹치면 목이 이긴다.
   */
  const useMockApi = env.DEV_API_MOCK === '1';
  const target = useMockApi ? undefined : env.DEV_API_PROXY;

  return {
    plugins: [react(), tailwindcss(), appName(), ...(useMockApi ? [mockApi()] : [])],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: target
      ? {
          proxy: {
            '/api': {
              target,
              changeOrigin: true,
              /* SSE는 흘려 보내야 한다 — 모아 뒀다 한 번에 주면 카드가 늦게 뜬다 */
              configure: (proxy) =>
                proxy.on('proxyRes', (res) => {
                  if (res.headers['content-type']?.includes('text/event-stream')) {
                    delete res.headers['content-length'];
                  }
                }),
            },
          },
        }
      : undefined,
  };
});
