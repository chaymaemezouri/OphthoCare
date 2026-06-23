import { create } from 'zustand';

interface UserState {
  displayName: string | null;
  setDisplayName: (n: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  displayName: null,
  setDisplayName: (n) => set({ displayName: n }),
}));
