import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Course {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
}

export interface Proposal {
  proposalId: number;
  myCourse: Course;
  partnerCourse: Course;
  matchRank: number;
  expiresAt: string;
  remainSeconds: number;
}

export interface Post {
  postId: number;
  discardCourse: Course;
  wantedCourses: { priority: number; course: Course }[];
  proposalCount: number;
  createdAt: string;
  requestStatus?: 'PENDING' | null;
}

export interface HomeData {
  unreadCount: number;
  heroBanner?: {
    exchangeId: number;
    chatRoomId: number;
    scheduledAt: string;
    remainSeconds: number;
    myCourse: Course;
    partnerCourse: Course;
  };
  receivedProposals: Proposal[];
  recommendedFeed: {
    posts: Post[];
    page: number;
    hasNext: boolean;
  };
}

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
