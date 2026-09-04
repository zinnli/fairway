import { create } from 'zustand';
import { service, type Session } from '@/api';
import { GUEST_ACCESS } from '@/config';

/**
 * 지금 누가 들어와 있는가. 라우트 가드가 이걸 본다.
 *
 * 액세스 토큰은 메모리에만 있어서(전송 계층) 새로고침하면 사라진다.
 * 그래서 앱이 뜨면 한 번 되살려 보고, 그동안 화면은 'checking'으로 기다린다 —
 * 확인하기 전에 로그인 화면으로 보내면 새로고침할 때마다 튕겨 나간다.
 */
export type SessionStatus = 'checking' | 'in' | 'out';

interface SessionState {
  status: SessionStatus;
  user: Session | null;
  /**
   * 세션이 없을 때 어디로 보낼지. 나가는 방식이 다르면 가는 곳도 다르다 —
   * 내가 눌러서 나갔으면 첫 화면(F05), 쓰다가 풀렸으면 로그인 화면.
   * 길을 옮기는 쪽과 세션을 내리는 쪽이 경쟁하지 않도록 가드 한 곳에서만 정한다.
   */
  exit: '/' | '/login';
  /** 앱이 뜰 때 한 번. 두 번 불러도 한 번만 돈다 */
  boot: () => Promise<void>;
  signIn: (user: Session) => void;
  signOut: () => Promise<void>;
  /** 401이 끝내 안 풀렸을 때 전송 계층이 부른다 */
  expire: () => void;
}

let booted = false;

export const useSessionStore = create<SessionState>((set) => ({
  status: 'checking',
  user: null,
  exit: '/login',

  boot: async () => {
    if (booted) return;
    booted = true;

    /* 서버가 익명 세션으로 가르는 방식이면 우리가 확인할 것이 없다 */
    if (GUEST_ACCESS === 'anonymous') {
      set({ status: 'in', user: null });
      return;
    }

    const restored = await service.restoreSession();
    if (restored) {
      set({ status: 'in', user: restored });
      return;
    }
    /* 심사위원이 주소만 열었을 때 — 체험 계정으로 대신 들어간다 (6.3, P0) */
    if (GUEST_ACCESS === 'demo') {
      const guest = await service.demoLogin();
      if (guest) {
        set({ status: 'in', user: guest });
        return;
      }
    }
    set({ status: 'out', user: null, exit: '/login' });
  },

  signIn: (user) => set({ status: 'in', user, exit: '/login' }),

  signOut: async () => {
    /* 먼저 내리고 나서 서버에 알린다 — 화면은 기다릴 이유가 없다 */
    booted = true;
    set({ status: 'out', user: null, exit: '/' });
    await service.logout().catch(() => {});
  },

  expire: () => set({ status: 'out', user: null, exit: '/login' }),
}));
