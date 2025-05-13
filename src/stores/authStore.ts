import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isCreator: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setIsCreator: (isCreator: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isCreator: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setIsCreator: (isCreator) => set({ isCreator }),
}));