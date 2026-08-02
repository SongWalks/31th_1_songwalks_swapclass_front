import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('soo_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

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

    // 2. 403 에러: 권한 없음 (정지된 사용자 OR 비로그인/권한 부족)
    if (error.response?.status === 403) {
      const backendMessage = error.response?.data?.message;
      const suspendedUntil = error.response?.data?.data?.suspendedUntil;

      // 케이스 A: 진짜 정지된 유저 (suspendedUntil 값이 존재함)
      if (suspendedUntil) {
        const formattedDate = suspendedUntil.split('T')[0];
        alert(
          `${backendMessage || '이용이 정지된 계정입니다.'}\n정지 해제일: ${formattedDate}`,
        );
      }
      // 케이스 B: 비로그인 유저이거나 일반적인 권한 부족 에러
      else {
        // 백엔드가 준 메시지가 있으면 띄우고, 없으면 일반 안내 문구 노출
        alert(backendMessage || '로그인이 필요합니다.');
      }

      // 두 케이스 모두 토큰 지우고 로그인으로 쫓아냄
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }

    // 다른 모든 에러는 그대로 통과시켜서 개별 컴포넌트(ReportPage 등)의 catch 블록으로 보냄
    return Promise.reject(error);
  },
);

export default axiosInstance;
