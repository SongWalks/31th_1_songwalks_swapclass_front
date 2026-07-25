// @/api/MatchApi.ts
import axiosInstance from '@/api/axiosInstance';

// 💡 match-controller: GET /api/matches/recommendations

export interface RecommendationItem {
  id: number;
  matchRank: number;
  requestStatus: string; // 정확한 enum 값(예: 'NONE' | 'PENDING' | 'ACCEPTED' 등)은 백엔드 확인 필요
}

export interface RecommendationsResponse {
  posts: RecommendationItem[];
  hasNext: boolean;
}

interface GetRecommendationsParams {
  postId: number;
  page?: number;
  size?: number;
}

/**
 * 내 게시글(postId) 기준 추천 교환 후보 목록을 조회합니다.
 * @param postId 내 게시글 ID
 * @param page 페이지 번호 (기본 0)
 * @param size 페이지 크기 (기본 20)
 */
export const getRecommendations = async ({
  postId,
  page = 0,
  size = 20,
}: GetRecommendationsParams): Promise<RecommendationsResponse> => {
  const response = await axiosInstance.get('/api/matches/recommendations', {
    params: { postId, page, size },
  });

  return response.data?.data as RecommendationsResponse;
};
