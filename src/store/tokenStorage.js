const ACCESS_TOKEN_KEY = 'soo_access_token';
const REFRESH_TOKEN_KEY = 'soo_refresh_token';
const EXPIRES_AT_KEY = 'soo_token_expires_at';

function getStorage(persist) {
  return persist ? window.localStorage : window.sessionStorage;
}

function decodeJwtExpiresAt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function saveTokens({ accessToken, refreshToken }, persist) {
  const storage = getStorage(persist);
  const expiresAt =
    decodeJwtExpiresAt(accessToken) ?? Date.now() + 30 * 60 * 1000;

  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.setItem(EXPIRES_AT_KEY, String(expiresAt));

  const other = getStorage(!persist);
  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);
  other.removeItem(EXPIRES_AT_KEY);
}

export function getTokens() {
  const storage = window.localStorage.getItem(ACCESS_TOKEN_KEY)
    ? window.localStorage
    : window.sessionStorage;

  const accessToken = storage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  const expiresAt = Number(storage.getItem(EXPIRES_AT_KEY)) || 0;

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, expiresAt, storage };
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
  });
}
