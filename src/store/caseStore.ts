import { create } from 'zustand';
import { api } from '@/api';
import type { CaseSummary } from '@/domain/case';

/**
 * 사건 목록 스토어 — 사이드바(HiSidebar)가 26화면에 걸쳐 이 목록을 쓴다.
 * 사건 하나의 속내용(대화·사실·판정)은 여기 두지 않는다. 작업 화면이 따로 들고 간다.
 */
interface CaseState {
  list: CaseSummary[];
  loaded: boolean;
  /** 이번에 온보딩을 닫았는지. 사건이 0개여도 다시 던지지 않으려고 둔다 */
  onboardingSeen: boolean;
  markOnboardingSeen: () => void;
  load: () => Promise<void>;
  create: () => Promise<string>;
  rename: (caseId: string, title: string) => Promise<void>;
  remove: (caseId: string) => Promise<void>;
}

export const useCaseStore = create<CaseState>((set, get) => ({
  list: [],
  loaded: false,
  onboardingSeen: false,

  markOnboardingSeen: () => set({ onboardingSeen: true }),

  load: async () => {
    const list = await api.listCases();
    set({ list, loaded: true });
  },

  create: async () => {
    const created = await api.createCase();
    await get().load();
    return created.id;
  },

  rename: async (caseId, title) => {
    await api.renameCase(caseId, title);
    await get().load();
  },

  remove: async (caseId) => {
    await api.deleteCase(caseId);
    await get().load();
  },
}));
