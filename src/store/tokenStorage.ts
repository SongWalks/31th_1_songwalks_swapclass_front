const ACCESS_TOKEN_KEY = 'soo_access_token';
const REFRESH_TOKEN_KEY = 'soo_refresh_token';
const EXPIRES_AT_KEY = 'soo_token_expires_at';
const USER_EMAIL_KEY = 'soo_user_email';

function getStorage(persist: boolean): Storage {
  return persist ? window.localStorage : window.sessionStorage;
}

// 안전한 Base64URL 디코딩 (유니코드/한글 깨짐 방지)
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function decodeJwtExpiresAt(token: string): number | null {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
}

export function decodeUserId(token: string): string | null {
  const payload = decodeJwtPayload(token);
  return payload?.sub ?? null;
}

export function saveTokens(
  { accessToken, refreshToken }: { accessToken: string; refreshToken: string },
  persist: boolean,
  email?: string | null,
) {
  const storage = getStorage(persist);
  // 토큰 파싱 실패 시 기본 30분 만료 적용
  const expiresAt =
    decodeJwtExpiresAt(accessToken) ?? Date.now() + 30 * 60 * 1000;

  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  if (email) storage.setItem(USER_EMAIL_KEY, email);

  // 반대 쪽 Storage에 잔재가 없도록 깨끗이 정리
  const otherStorage = getStorage(!persist);
  otherStorage.removeItem(ACCESS_TOKEN_KEY);
  otherStorage.removeItem(REFRESH_TOKEN_KEY);
  otherStorage.removeItem(EXPIRES_AT_KEY);
  otherStorage.removeItem(USER_EMAIL_KEY);
}

export function getTokens() {
  const isLocalStorage = Boolean(window.localStorage.getItem(ACCESS_TOKEN_KEY));
  const storage = isLocalStorage ? window.localStorage : window.sessionStorage;

  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  const expiresAt = Number(storage.getItem(EXPIRES_AT_KEY)) || 0;
  const email = storage.getItem(USER_EMAIL_KEY);

  if (!accessToken || !refreshToken) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt,
    email,
    storage,
    isPersisted: isLocalStorage,
  };
}

/**
 * @param bufferMs 만료 여부를 판별할 여유 시간 (기본값: 30초)
 */
export function isTokenExpired(
  expiresAt: number,
  bufferMs = 30 * 1000,
): boolean {
  return Date.now() >= expiresAt - bufferMs;
}

export function clearTokens() {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(EXPIRES_AT_KEY);
    storage.removeItem(USER_EMAIL_KEY);
  });
}
