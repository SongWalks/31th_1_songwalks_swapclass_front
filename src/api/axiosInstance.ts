import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// TODO: 요청 인터셉터 — 토큰 자동 첨부 (나중에 채워야 됨)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// TODO: 응답 인터셉터 — 401 처리 등 (나중에 채워야 됨)
// 응답 인터셉터 — 전역 에러 처리
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. 401 에러: 토큰 만료 또는 로그인 안 된 상태
    if (error.response?.status === 401) {
      alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
      // 인증 정보 지우고 로그인 페이지로 쫓아내기
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }

    // 2. 403 에러: 권한 없음 (정지된 사용자 처리)
    if (error.response?.status === 403) {
      // TODO: 백엔드에서 정지 사유나 날짜를 내려준다고 가정 (명세서에 맞게 수정 필요)
      const message =
        error.response?.data?.message || '이용이 정지된 계정입니다.';
      const suspendedUntil = error.response?.data?.suspendedUntil;

      if (suspendedUntil) {
        alert(`${message}\n정지 해제일: ${suspendedUntil}`);
      } else {
        alert(message);
      }

      // 강제로 로그인 풀고 쫓아내기
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }

    // 다른 모든 에러는 그대로 통과시켜서 개별 컴포넌트(ReportPage 등)의 catch 블록으로 보냄
    return Promise.reject(error);
  },
);

export default axiosInstance;
