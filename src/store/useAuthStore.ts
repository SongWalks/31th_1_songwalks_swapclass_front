import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: number;
  nickname: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  // persist 미들웨어로 감싸기
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (user) => set({ user, isLoggedIn: true }),
      logout: () => set({ user: null, isLoggedIn: false }),
    }),
    {
      name: 'auth-storage', // localStorage에 저장될 키(Key) 이름
      storage: createJSONStorage(() => localStorage), // 기본값은 localStorage
    },
  ),
);

// ! 엑세스 토큰(Access Token)이나 비밀번호 같은 민감한 정보는 절대 이 스토어 안에 같이 넣어서 저장하시면 안 됩니다.
