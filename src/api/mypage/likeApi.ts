import axiosInstance from '@/api/axiosInstance';

// 1. 찜 목록 조회 API
export const getLikePosts = async () => {
  const response = await axiosInstance.get('/api/me/likes');
  return response.data;
};

// 2. 찜 취소 API (Swagger 명세 반영)
export const deleteLikePost = async (postId: number) => {
  const response = await axiosInstance.delete(`/api/posts/${postId}/likes`);
  return response.data;
};
