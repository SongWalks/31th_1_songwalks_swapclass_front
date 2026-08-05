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

  if (isTokenExpired()) {
    try {
      const { data } = await refreshTokenRequest(tokens.refreshToken);
      // autoLogin 여부(=원래 저장 위치)는 그대로 유지
      const wasPersisted = tokens.storage === window.localStorage;
      saveTokens(data, wasPersisted, tokens.email);

      useAuthStore.getState().login({
        id: decodeUserId(data.accessToken),
        email: tokens.email ?? '',
      });
    } catch {
      clearTokens();
    }
    return;
  }

  useAuthStore.getState().login({
    id: decodeUserId(tokens.accessToken),
    email: tokens.email ?? '',
  });
}
