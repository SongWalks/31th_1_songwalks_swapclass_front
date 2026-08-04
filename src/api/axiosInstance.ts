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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 에러가 발생한 요청의 URL 확인
    const errorUrl = error.config?.url || '';

    // 조용히 넘어가야 하는(강제 이동을 막아야 하는) 백그라운드 API 목록
    const silentUrls = ['/api/posts/me'];
    const isSilentRequest = silentUrls.some((url) => errorUrl.includes(url));

    // 1. 401 에러: 토큰 만료 또는 로그인 안 된 상태
    if (error.response?.status === 401) {
      localStorage.removeItem('soo_access_token');

      if (!isSilentRequest) {
        alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        window.location.href = '/login';
      }
    }

    // 2. 403 에러: 권한 없음
    if (error.response?.status === 403) {
      localStorage.removeItem('soo_access_token');

      if (!isSilentRequest) {
        const backendMessage = error.response?.data?.message;
        const suspendedUntil = error.response?.data?.data?.suspendedUntil;

        if (suspendedUntil) {
          const formattedDate = suspendedUntil.split('T')[0];
          alert(
            `${backendMessage || '이용이 정지된 계정입니다.'}\n정지 해제일: ${formattedDate}`,
          );
        } else {
          alert(backendMessage || '로그인이 필요합니다.');
        }
        window.location.href = '/login';
      }
    }

    // 다른 모든 에러(또는 silentRequest의 에러)는 그대로 통과
    return Promise.reject(error);
  },
);

export default axiosInstance;
