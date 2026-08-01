import { apiFetch, ApiError } from './client';
import { getTokens } from '../../store/tokenStorage';

export { ApiError };

/**
 * 이메일 인증코드 발송
 * POST /api/auth/email/code
 * body: { email }
 */
export function sendEmailCode(email) {
  return apiFetch('/api/auth/email/code', { method: 'POST', body: { email } });
}

/**
 * 이메일 인증코드 검증
 * POST /api/auth/email/verify
 * body: { email, code }
 */
export function verifyEmailCode(email, code) {
  return apiFetch('/api/auth/email/verify', {
    method: 'POST',
    body: { email, code },
  });
}

/**
 * 이메일(아이디) 중복 확인
 * GET /api/auth/email/exists?email=...
 * ⚠ 쿼리 파라미터 이름 미확인 상태 (email로 가정). 실제 응답 확인 후 조정 필요.
 */
export function checkEmailExists(email) {
  return apiFetch(`/api/auth/email/exists?email=${encodeURIComponent(email)}`);
}

/**
 * 회원가입
 * POST /api/auth/signup
 * body: { email, password, passwordConfirm }
 */
export function signupRequest({ email, password, passwordConfirm }) {
  return apiFetch('/api/auth/signup', {
    method: 'POST',
    body: { email, password, passwordConfirm },
  });
}

/**
 * 로그인
 * POST /api/auth/login
 * body: { email, password }
 * response.data: { accessToken, refreshToken }
 */
export function loginRequest({ email, password }) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

/**
 * 토큰 재발급
 * POST /api/auth/token/refresh
 * body: { refreshToken }
 * response.data: { accessToken, refreshToken }
 */
export function refreshTokenRequest(refreshToken) {
  return apiFetch('/api/auth/token/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
}

/**
 * 로그아웃
 * POST /api/auth/logout
 * Authorization: Bearer {accessToken}
 */
export function logoutRequest() {
  const tokens = getTokens();
  return apiFetch('/api/auth/logout', {
    method: 'POST',
    token: tokens?.accessToken,
  });
}

/**
 * 비밀번호 재설정용 인증코드 발송 (findpw 전용, 미가입 이메일이면 404)
 * POST /api/auth/password/email/code
 * body: { email }
 */
export function sendPasswordResetCode(email) {
  return apiFetch('/api/auth/password/email/code', {
    method: 'POST',
    body: { email },
  });
}

/**
 * 비밀번호 재설정 (인증 완료 후 새 비밀번호로 교체)
 * POST /api/auth/password/reset
 * body: { email, newPassword, newPasswordConfirm }
 *
 * ※ 인증코드 확인 자체는 기존 verifyEmailCode(/api/auth/email/verify)를 재사용
 */
export function resetPasswordRequest({
  email,
  newPassword,
  newPasswordConfirm,
}) {
  return apiFetch('/api/auth/password/reset', {
    method: 'POST',
    body: { email, newPassword, newPasswordConfirm },
  });
}
