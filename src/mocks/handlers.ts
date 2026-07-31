import { http, HttpResponse } from 'msw';

const BASE_URL = 'https://swapclass.duckdns.org';

let mockPosts = [
  {
    id: 1,
    type: 'TIP',
    courseId: 1,
    courseName: '프론트엔드 UI 테스트',
    title: 'MSW로 띄운 가짜 목록입니다',
    content: '목록 페이지가 잘 동작하네요! 이제 새 글쓰기도 테스트해 보세요.',
    authorId: 1,
    likeCount: 5,
    commentCount: 1,
    liked: false,
    bookmarked: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [
      {
        id: 101,
        userId: 1,
        content: '첫 번째 테스트 댓글입니다!',
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

export const handlers = [
  // 1. 목록 조회
  http.get(`${BASE_URL}/api/lounge/posts`, () => {
    const listData = mockPosts.map((p) => ({
      id: p.id,
      type: p.type,
      courseId: p.courseId,
      courseName: p.courseName,
      title: p.title,
      content: p.content,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt,
    }));
    return HttpResponse.json({
      success: true,
      data: { posts: listData },
      message: '성공',
    });
  }),

  // 2. 게시글 작성
  http.post(`${BASE_URL}/api/lounge/posts`, async ({ request }) => {
    const body = (await request.json()) as any;
    const newId = Date.now();

    const targetCourseId = body.courseId || 1;

    let resolvedCourseName = `임시 과목 ${targetCourseId}`;
    try {
      // MSW는 브라우저 환경에서 돌아가므로 window.sessionStorage 접근이 가능합니다.
      const savedCourseStr = window.sessionStorage.getItem('selectedCourse');
      if (savedCourseStr) {
        const savedCourse = JSON.parse(savedCourseStr);
        // 저장된 courseId와 일치할 때만 이름을 씁니다.
        if (savedCourse.courseId === targetCourseId) {
          resolvedCourseName = savedCourse.title || savedCourse.name;
        }
      }
    } catch (e) {
      // 세션 스토리지 접근 실패 시 무시
    }

    const newPost = {
      id: newId,
      type: body.type || 'TIP',
      courseId: body.courseId || 1,
      courseName: resolvedCourseName,
      title: body.title,
      content: body.content,
      authorId: 1,
      likeCount: 0,
      commentCount: 0,
      liked: false,
      bookmarked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    };
    mockPosts.unshift(newPost);
    return HttpResponse.json(
      { success: true, data: { id: newId }, message: '성공' },
      { status: 201 },
    );
  }),

  // 3. 좋아요 (✨ 버그 수정됨!)
  http.post(`${BASE_URL}/api/lounge/posts/:postId/likes`, ({ params }) => {
    const postId = Number(params.postId);
    const post = mockPosts.find((p) => p.id === postId);

    let currentLiked = false;
    let currentLikeCount = 0;

    if (post) {
      post.liked = !post.liked;
      post.likeCount += post.liked ? 1 : -1;
      currentLiked = post.liked;
      currentLikeCount = post.likeCount;
    }

    return HttpResponse.json({
      success: true,
      data: { liked: currentLiked, likeCount: currentLikeCount },
      message: '성공',
    });
  }),

  // 4. 북마크 (✨ 버그 수정됨!)
  http.post(`${BASE_URL}/api/lounge/posts/:postId/bookmarks`, ({ params }) => {
    const postId = Number(params.postId);
    const post = mockPosts.find((p) => p.id === postId);

    let currentBookmarked = false;

    if (post) {
      post.bookmarked = !post.bookmarked;
      currentBookmarked = post.bookmarked;
    }

    return HttpResponse.json({
      success: true,
      data: { bookmarked: currentBookmarked },
      message: '성공',
    });
  }),

  // 5. 상세 조회
  http.get(`${BASE_URL}/api/lounge/posts/:postId`, ({ params }) => {
    const postId = Number(params.postId);
    const post = mockPosts.find((p) => p.id === postId);
    if (!post)
      return HttpResponse.json(
        { success: false, data: null, message: '없음' },
        { status: 404 },
      );
    return HttpResponse.json({ success: true, data: post, message: '성공' });
  }),

  // 6. 게시글 삭제
  http.delete(`${BASE_URL}/api/lounge/posts/:postId`, ({ params }) => {
    const postId = Number(params.postId);
    mockPosts = mockPosts.filter((p) => p.id !== postId);
    return HttpResponse.json({
      success: true,
      data: '삭제 성공',
      message: '성공',
    });
  }),

  // 7. 게시글 수정
  http.patch(
    `${BASE_URL}/api/lounge/posts/:postId`,
    async ({ request, params }) => {
      const postId = Number(params.postId);
      const body = (await request.json()) as any;
      const postIndex = mockPosts.findIndex((p) => p.id === postId);
      if (postIndex !== -1) {
        mockPosts[postIndex] = {
          ...mockPosts[postIndex],
          title: body.title,
          content: body.content,
          updatedAt: new Date().toISOString(),
        };
      }
      return HttpResponse.json({
        success: true,
        data: '수정 성공',
        message: '성공',
      });
    },
  ),

  // ==========================================
  // 8. 🚀 댓글 작성 (새로 추가됨!)
  // ==========================================
  http.post(
    `${BASE_URL}/api/lounge/posts/:postId/comments`,
    async ({ request, params }) => {
      const postId = Number(params.postId);
      const body = (await request.json()) as any;

      const postIndex = mockPosts.findIndex((p) => p.id === postId);
      if (postIndex !== -1) {
        const newComment = {
          id: Date.now(),
          userId: 1, // 테스트용 본인 아이디
          content: body.content,
          createdAt: new Date().toISOString(),
        };
        mockPosts[postIndex].comments.push(newComment);
        mockPosts[postIndex].commentCount += 1;

        return HttpResponse.json(
          { success: true, data: { id: newComment.id }, message: '댓글 작성' },
          { status: 201 },
        );
      }

      return HttpResponse.json(
        { success: false, data: null, message: '게시글 없음' },
        { status: 404 },
      );
    },
  ),

  // ==========================================
  // 9. 🚀 댓글 삭제 (새로 추가됨!)
  // ==========================================
  http.delete(`${BASE_URL}/api/lounge/comments/:commentId`, ({ params }) => {
    const commentId = Number(params.commentId);

    mockPosts = mockPosts.map((post) => {
      const hasComment = post.comments.some((c) => c.id === commentId);
      if (hasComment) {
        return {
          ...post,
          comments: post.comments.filter((c) => c.id !== commentId),
          commentCount: post.commentCount - 1,
        };
      }
      return post;
    });

    return HttpResponse.json({
      success: true,
      data: 'OK',
      message: '댓글 삭제',
    });
  }),
];
