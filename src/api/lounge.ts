import axiosInstance from './axiosInstance'; // 실제 axios 인스턴스 경로
import type {
  CreatePostRequest,
  CreatePostResponse,
  UpdatePostRequest,
  UpdatePostResponse,
  PostDetailResponse,
  ToggleLikeResponse,
  ToggleBookmarkResponse,
  DeletePostResponse,
  CreateCommentRequest,
  CreateCommentResponse,
  DeleteCommentResponse,
} from '@/types/lounge';

// 1. 게시글 작성 API
export const createPost = async (
  data: CreatePostRequest,
): Promise<CreatePostResponse> => {
  const response = await axiosInstance.post<CreatePostResponse>(
    '/api/lounge/posts',
    data,
  );
  return response.data;
};

// 2. 단일 게시글 조회 API
export const getPostDetail = async (
  postId: number,
): Promise<PostDetailResponse> => {
  const response = await axiosInstance.get<PostDetailResponse>(
    `/api/lounge/posts/${postId}`,
  );
  return response.data;
};

// 3. 게시글 수정 API
export const updatePost = async ({
  postId,
  data,
}: {
  postId: number;
  data: UpdatePostRequest;
}): Promise<UpdatePostResponse> => {
  const response = await axiosInstance.patch<UpdatePostResponse>(
    `/api/lounge/posts/${postId}`,
    data,
  );
  return response.data;
};

// 4. 좋아요 토글 API
export const toggleLike = async (
  postId: number,
): Promise<ToggleLikeResponse> => {
  const response = await axiosInstance.post<ToggleLikeResponse>(
    `/api/lounge/posts/${postId}/likes`,
  );
  return response.data;
};

// 5. 북마크 토글 API
export const toggleBookmark = async (
  postId: number,
): Promise<ToggleBookmarkResponse> => {
  const response = await axiosInstance.post<ToggleBookmarkResponse>(
    `/api/lounge/posts/${postId}/bookmarks`,
  );
  return response.data;
};

// 6. 게시글 삭제 API
export const deletePost = async (
  postId: number,
): Promise<DeletePostResponse> => {
  const response = await axiosInstance.delete<DeletePostResponse>(
    `/api/lounge/posts/${postId}`,
  );
  return response.data;
};

// 7. 댓글 작성 API
export const createComment = async (
  postId: number,
  data: CreateCommentRequest,
): Promise<CreateCommentResponse> => {
  const response = await axiosInstance.post<CreateCommentResponse>(
    `/api/lounge/posts/${postId}/comments`,
    data,
  );
  return response.data;
};

// 8. 댓글 삭제 API
export const deleteComment = async (
  commentId: number,
): Promise<DeleteCommentResponse> => {
  const response = await axiosInstance.delete<DeleteCommentResponse>(
    `/api/lounge/comments/${commentId}`,
  );
  return response.data;
};

export interface FetchPostsRequest {
  type?: 'TIP' | 'CLOSURE';
  courseId?: number;
  keyword?: string;
}

export interface LoungePostDTO {
  id: number;
  type: 'TIP' | 'CLOSURE';
  courseId: number;
  courseName: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export interface FetchPostsResponse {
  success: boolean;
  data: {
    posts: LoungePostDTO[];
  };
  message: string;
}

// 9. 라운지 게시글 목록 조회 API (맨 아래에 추가)
export const getLoungePosts = async (
  params: FetchPostsRequest,
): Promise<FetchPostsResponse> => {
  const response = await axiosInstance.get<FetchPostsResponse>(
    '/api/lounge/posts',
    { params },
  );
  return response.data;
};
