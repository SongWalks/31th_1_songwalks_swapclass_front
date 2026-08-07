import { useAuthStore } from './useAuthStore';
import {
  getTokens,
  isTokenExpired,
  decodeUserId,
  saveTokens,
  clearTokens,
} from './tokenStorage';
import { refreshTokenRequest } from '@/api/auth/authApi';

export async function bootstrapAuth() {
  const tokens = getTokens();
  if (!tokens) return;

  let currentAccessToken = tokens.accessToken;

  // 만료 30초 전이면 미리 토큰을 재발급받음 (Buffer time 적용)
  if (isTokenExpired(tokens.expiresAt)) {
    try {
      const { data } = await refreshTokenRequest(tokens.refreshToken);

      saveTokens(data, tokens.isPersisted, tokens.email);
      currentAccessToken = data.accessToken;
      // 변경 후
    } catch (error) {
      console.error('인증 토큰 갱신 실패:', error);
      clearTokens();
      useAuthStore.getState().logout();
      return;
    }
  }

  const userId = decodeUserId(currentAccessToken);

  // JWT가 조작되었거나 sub 클레임이 없는 경우 처리
  if (!userId) {
    clearTokens();
    useAuthStore.getState().logout();
    return;
  }

  useAuthStore.getState().login({
    id: userId,
    email: tokens.email ?? '',
  });
}
