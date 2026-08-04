import axios from 'axios';

let isAuthAlertShown = false;

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
    const errorUrl = error.config?.url || '';
    const silentUrls = ['/api/posts/me'];
    const isSilentRequest = silentUrls.some((url) => errorUrl.includes(url));

    // 1. 401 에러
    if (error.response?.status === 401) {
      localStorage.removeItem('soo_access_token');

      if (!isSilentRequest && !isAuthAlertShown) {
        isAuthAlertShown = true; // 스위치 켜기 (다른 API가 에러나도 무시됨)
        alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        window.location.href = '/login';
      }
    }

    // 2. 403 에러
    if (error.response?.status === 403) {
      localStorage.removeItem('soo_access_token');

      // 💡 3. 알림이 아직 안 떴을 때만 실행
      if (!isSilentRequest && !isAuthAlertShown) {
        isAuthAlertShown = true; // 스위치 켜기

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

    return Promise.reject(error);
  },
);

export default axiosInstance;
