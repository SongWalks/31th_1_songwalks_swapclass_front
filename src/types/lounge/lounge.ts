// --- API 요청/응답 타입 ---

export interface CreatePostRequest {
  type: 'TIP' | 'CLOSURE';
  courseId: number;
  title: string;
  content: string;
}

export interface CreatePostResponse {
  success: boolean;
  data: {
    id: number;
  };
  message: string;
}

export interface UpdatePostRequest {
  type: 'TIP' | 'CLOSURE';
  title: string;
  content: string;
}

export interface UpdatePostResponse {
  success: boolean;
  data: string;
  message: string;
}

export interface CommentType {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
}

export interface PostDetailData {
  id: number;
  type: 'TIP' | 'CLOSURE';
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
  comments: CommentType[];
}

export interface PostDetailResponse {
  success: boolean;
  data: PostDetailData;
  message: string;
}

// --- 프론트엔드 UI용 확장 타입 ---

// 서버에서 주는 기본 댓글(CommentType)에 UI 렌더링용 속성을 추가한 타입
export interface LocalComment extends CommentType {
  author: string;
  time: string;
  isMine: boolean;
}

export interface ToggleLikeResponse {
  success: boolean;
  data: {
    liked: boolean;
    likeCount: number; // 스웨거 명세에 맞춰 likeCount 포함
  };
  message: string;
}

export interface ToggleBookmarkResponse {
  success: boolean;
  data: {
    bookmarked: boolean;
  };
  message: string;
}

export interface DeletePostResponse {
  success: boolean;
  data: string;
  message: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CreateCommentResponse {
  success: boolean;
  data: {
    id: number;
    postId: number;
    userId: number;
    content: string;
    createdAt: string;
  };
  message: string;
}

export interface DeleteCommentResponse {
  success: boolean;
  data: string;
  message: string;
}
