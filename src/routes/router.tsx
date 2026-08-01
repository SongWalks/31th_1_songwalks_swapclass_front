import { createBrowserRouter } from 'react-router-dom';

// --- 1. 레이아웃 불러오기 ---
import RootLayout from '@/components/layout/RootLayout';
import DefaultLayout from '@/components/layout/DefaultLayout';
import FullScreenLayout from '@/components/layout/FullScreenLayout';
import BoardPage from '@/pages/Posts/BoardPage';
import PostWritePage from '@/pages/Posts/PostWritePage';
import CourseSearchPage from '@/pages/Posts/CourseSearchPage';
//import SpecificPostsPage from '@/pages/ExchangeRecommendPage/SpecificPostsPage';
//import SelectMyPostPage from '@/pages/ExchangeRecommendPage/SelectMyPostPage';

// --- 2. 페이지 불러오기  ---

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        // ==========================================
        // 💡 1번 그룹: 하단 네비게이션(BottomNav)이 있는 화면들
        // ==========================================
        element: <DefaultLayout />,
        children: [
          { path: '/board', element: <BoardPage /> }, // /board (교환게시판)
        ],
      },
      {
        // ==========================================
        // 💡 2번 그룹: 하단 바 없이 전체 화면을 쓰는 화면들
        // ==========================================
        element: <FullScreenLayout />,
        children: [
          // :id 나 :roomId 는 동적 라우팅 기법입니다. (ex. /board/123)
          // 예시: { path: '/board/:id', element: <DetailPage /> },    // 상세 게시글
          { path: '/board/write', element: <PostWritePage /> },
          { path: '/course-search', element: <CourseSearchPage /> },
          //{path: '/board/:postId/select-my-post',element: <SelectMyPostPage />,}, // 제안 보낼 내 게시글 선택
          //{ path: '/board/:postId', element: <SpecificPostsPage /> }, // 게시글 상세
        ],
      },
    ],
  },
]);
