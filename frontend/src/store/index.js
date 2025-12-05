import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 用户状态管理
export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'user-storage',
    }
  )
);

// 作品列表状态管理
export const useWorkStore = create((set) => ({
  works: [],
  page: 1,
  total: 0,
  loading: false,
  setWorks: (works) => set({ works }),
  addWorks: (newWorks) => set((state) => ({ works: [...state.works, ...newWorks] })),
  setPage: (page) => set({ page }),
  setTotal: (total) => set({ total }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ works: [], page: 1, total: 0, loading: false }),
}));
