import { create } from 'zustand';

interface AppState {
  // 侧边栏状态
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // 当前项目 ID
  currentProjectId: number | null;
  setCurrentProject: (id: number | null) => void;

  // 加载状态
  loading: boolean;
  setLoading: (v: boolean) => void;

  // 全局消息通知
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  clearNotification: () => void;

  // 历史记录（最近使用的灵感）
  recentIdeas: string[];
  addRecentIdea: (idea: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  currentProjectId: null,
  setCurrentProject: (id) => set({ currentProjectId: id }),

  loading: false,
  setLoading: (v) => set({ loading: v }),

  notification: null,
  showNotification: (type, message) => set({ notification: { type, message } }),
  clearNotification: () => set({ notification: null }),

  recentIdeas: [],
  addRecentIdea: (idea) =>
    set((s) => ({
      recentIdeas: [idea, ...s.recentIdeas.filter((i) => i !== idea)].slice(0, 10),
    })),
}));
