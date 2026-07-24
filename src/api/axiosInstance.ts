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
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 로그인 페이지로 리다이렉트 등
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
