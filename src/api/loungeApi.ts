import axiosInstance from './axiosInstance';

// ==========================================
// 1. 타입 정의
// ==========================================

export type LoungePostType = 'TIP' | 'CLOSURE';

// 라운지 게시글 목록 아이템
export interface LoungePostItem {
  id: number;
  type: LoungePostType;
  courseId: number;
  courseName: string;
  title: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

// 라운지 게시글 상세의 댓글 아이템
export interface LoungeComment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
}

// 라운지 게시글 상세 정보
export interface LoungePostDetail {
  id: number;
  type: LoungePostType;
  courseId: number;
  courseName: string;
  title: string;
  content: string;
  authorId: number;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
  comments: LoungeComment[];
}

// API 응답 기본 구조
interface BaseResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ==========================================
// 2. 라운지 API 함수들 (lounge-post-controller)
// ==========================================

export const getLoungePosts = async (params?: {
  type?: LoungePostType;
  courseId?: number;
  keyword?: string;
}) => {
  const response = await axiosInstance.get<
    BaseResponse<{ posts: LoungePostItem[] }>
  >('/api/lounge/posts', { params });
  return response.data;
};

export const getLoungePostDetail = async (postId: number) => {
  const response = await axiosInstance.get<BaseResponse<LoungePostDetail>>(
    `/api/lounge/posts/${postId}`,
  );
  return response.data;
};

export const createLoungePost = async (data: {
  type: LoungePostType;
  courseId: number;
  title: string;
  content: string;
}) => {
  const response = await axiosInstance.post<BaseResponse<{ id: number }>>(
    '/api/lounge/posts',
    data,
  );
  return response.data;
};

export const updateLoungePost = async (
  postId: number,
  data: {
    type: LoungePostType;
    title: string;
    content: string;
  },
) => {
  const response = await axiosInstance.patch<BaseResponse<string>>(
    `/api/lounge/posts/${postId}`,
    data,
  );
  return response.data;
};

export const deleteLoungePost = async (postId: number) => {
  const response = await axiosInstance.delete<BaseResponse<string>>(
    `/api/lounge/posts/${postId}`,
  );
  return response.data;
};

export const toggleLoungePostLike = async (postId: number) => {
  const response = await axiosInstance.post<
    BaseResponse<{ liked: boolean; likeCount: number }>
  >(`/api/lounge/posts/${postId}/likes`);
  return response.data;
};

export const toggleLoungePostBookmark = async (postId: number) => {
  const response = await axiosInstance.post<
    BaseResponse<{ bookmarked: boolean }>
  >(`/api/lounge/posts/${postId}/bookmarks`);
  return response.data;
};

// ==========================================
// 3. 댓글 API 함수들 (lounge-comment-controller)
// ==========================================

/**
 * [POST] 댓글 작성
 */
export const createLoungeComment = async (postId: number, content: string) => {
  const response = await axiosInstance.post<
    BaseResponse<{
      id: number;
      postId: number;
      userId: number;
      content: string;
      createdAt: string;
    }>
  >(`/api/lounge/posts/${postId}/comments`, { content });
  return response.data;
};

/**
 * [DELETE] 댓글 삭제
 */
export const deleteLoungeComment = async (commentId: number) => {
  const response = await axiosInstance.delete<BaseResponse<string>>(
    `/api/lounge/comments/${commentId}`,
  );
  return response.data;
};

// ==========================================
// 4. 내 활동 API 함수들 (my-lounge-controller)
// ==========================================

/**
 * [GET] 내가 쓴 라운지 게시글 조회
 */
export const getMyLoungePosts = async () => {
  const response = await axiosInstance.get<
    BaseResponse<{ posts: LoungePostItem[] }>
  >('/api/me/lounge-posts');
  return response.data;
};

/**
 * [GET] 내가 북마크한 라운지 게시글 조회
 */
export const getMyLoungeBookmarks = async () => {
  const response = await axiosInstance.get<
    BaseResponse<{ posts: LoungePostItem[] }>
  >('/api/me/lounge-bookmarks');
  return response.data;
};
