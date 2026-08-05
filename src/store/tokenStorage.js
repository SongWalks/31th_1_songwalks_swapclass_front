const ACCESS_TOKEN_KEY = 'soo_access_token';
const REFRESH_TOKEN_KEY = 'soo_refresh_token';
const EXPIRES_AT_KEY = 'soo_token_expires_at';
const USER_EMAIL_KEY = 'soo_user_email'; // 프로필 조회 API가 없어서 이메일만 같이 보관

function getStorage(persist) {
  return persist ? window.localStorage : window.sessionStorage;
}

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function decodeJwtExpiresAt(token) {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
}

// JWT의 sub 클레임 = 유저 id (문자열로 옴)
export function decodeUserId(token) {
  const payload = decodeJwtPayload(token);
  return payload?.sub ?? null;
}

export function saveTokens({ accessToken, refreshToken }, persist, email) {
  const storage = getStorage(persist);
  const expiresAt =
    decodeJwtExpiresAt(accessToken) ?? Date.now() + 30 * 60 * 1000;

  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  if (email) storage.setItem(USER_EMAIL_KEY, email);

  const other = getStorage(!persist);
  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);
  other.removeItem(EXPIRES_AT_KEY);
  other.removeItem(USER_EMAIL_KEY);
}

export function getTokens() {
  const storage = window.localStorage.getItem(ACCESS_TOKEN_KEY)
    ? window.localStorage
    : window.sessionStorage;

  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  const expiresAt = Number(storage.getItem(EXPIRES_AT_KEY)) || 0;
  const email = storage.getItem(USER_EMAIL_KEY);

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, expiresAt, email, storage };
}

export function isTokenExpired() {
  const tokens = getTokens();
  if (!tokens) return true;
  return Date.now() >= tokens.expiresAt;
}

export function clearTokens() {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(EXPIRES_AT_KEY);
    storage.removeItem(USER_EMAIL_KEY);
  });
}
