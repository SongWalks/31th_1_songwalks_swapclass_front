import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface HomeData {
  state: 'empty' | 'active' | 'alert';
  userName?: string;
  receivedRequests: any[];
  recommendedMatches: any[];
  posts?: any[];
  hasNext?: boolean;
}

// API 호출 함수
export const fetchHomeData = async (): Promise<HomeData> => {
  const response = await axiosInstance.get<ApiResponse<HomeData>>('/api/home');

  return response.data.data;
};

// React Query 커스텀 훅
export const useHomeQuery = () => {
  return useQuery({
    queryKey: ['homeData'],
    queryFn: fetchHomeData,
    staleTime: 1000 * 60 * 5,
  });
};
