import type { Plugin } from 'vite';
import { createRouter } from './server/http.ts';
import { authorize, routes, seed, ACCESS_TTL_SEC } from './server/routes.ts';

/**
 * 개발 서버 안에서 도는 **가짜 백엔드**.
 *
 * 브라우저 목(`src/api/mock/`)은 화면이 서비스 인터페이스를 곧바로 부르는 것이라
 * 네트워크에 아무것도 남지 않는다. 화면만 볼 때는 그게 빠르지만, **무엇을 보내고
 * 무엇을 받는지**는 볼 수 없다. 이 플러그인은 같은 이야기를 진짜 HTTP로 답한다:
 *
 * · 요청·헤더·본문·상태 코드가 네트워크 탭에 그대로 찍힌다
 * · SSE는 EventStream 칸에 이벤트가 한 줄씩 쌓인다
 * · 전송 계층(`client.ts`)·DTO 매핑(`map.ts`)·오류 규격까지 함께 굴러간다 —
 *   브라우저 목은 이 세 겹을 건너뛴다
 *
 * 켜는 법 — `.env.local`에 세 줄:
 *   VITE_API=http
 *   VITE_API_BASE=/api/v1
 *   DEV_API_MOCK=1
 *
 * `DEV_API_PROXY`(진짜 서버 중계)와 같이 켜면 **이쪽이 이긴다** — 중계는 꺼진다.
 * 상태는 개발 서버 프로세스 메모리에 있다. 서버를 다시 띄우면 처음으로 돌아간다.
 */
export function mockApi(): Plugin {
  return {
    name: 'mock-api',
    apply: 'serve',
    configureServer(server) {
      const first = seed();
      const handle = createRouter(routes, {
        authorize,
        /* 즉시 답하면 로딩·잠금이 언제 도는지 볼 수 없다. 업로드는 좀 더 굼뜨게 */
        latency: (route) => (route.raw ? 0 : route.path.includes('/videos') ? 900 : 260),
        log: (line) => server.config.logger.info(`  \x1b[35m[목 API]\x1b[0m ${line}`),
      });

      server.middlewares.use('/api/v1', (req, res, next) => {
        void handle(req, res, next);
      });

      server.httpServer?.once('listening', () => {
        const l = server.config.logger;
        l.info('');
        l.info('  \x1b[35m목 API가 붙었습니다\x1b[0m — /api/v1 로 오는 요청은 개발 서버가 답합니다.');
        l.info(`  로그인: 아무 이메일 + 8자 이상 비밀번호 · 액세스 토큰 ${ACCESS_TTL_SEC}초`);
        l.info(`  시드 사건 1건 (${first.dto.id})`);
        l.info('');
      });
    },
  };
}
