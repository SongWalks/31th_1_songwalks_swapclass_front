import { createBrowserRouter } from 'react-router-dom';

// --- 1. 레이아웃 불러오기 ---
import RootLayout from '@/components/layout/RootLayout';
import DefaultLayout from '@/components/layout/DefaultLayout';
import FullScreenLayout from '@/components/layout/FullScreenLayout';

// --- 2. 페이지 불러오기  ---
import ExchangeRecommendPage from '@/pages/ExchangeRecommendPage/ExchangeRecommendPage';
import SpecificPostsPage from '@/pages/ExchangeRecommendPage/SpecificPostsPage';
import SelectMyPostPage from '@/pages/ExchangeRecommendPage/SelectMyPostPage';
import PosteditPage from '@/pages/ExchangeRecommendPage/PosteditPage';

import BoardPage from '@/pages/Posts/BoardPage';
import PostWritePage from '@/pages/Posts/PostWritePage';
import { LoungePage } from '@/pages/lounge/LoungePage';
import { PostDetailPage } from '@/pages/lounge/PostDetailPage';
import { LoungeWritePage } from '@/pages/lounge/LoungeWritePage';
import { CourseSearchPage } from '@/pages/common/CourseSearchPage';
import { PostEditPage } from '@/pages/lounge/PostEditPage';
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
          {
            //나중에 다 머지한 뒤에 라우터 수정
            path: 'my/exchange-recommend',
            element: <ExchangeRecommendPage />,
          },

          { path: '/board', element: <BoardPage /> }, // /board (교환게시판)
          { path: '/lounge', element: <LoungePage /> },
        ],
      },
      {
        // ==========================================
        // 💡 2번 그룹: 하단 바 없이 전체 화면을 쓰는 화면들
        // ==========================================
        element: <FullScreenLayout />,
        children: [
          {
            path: '/board/:postId/select-my-post',
            element: <SelectMyPostPage />,
          }, // 제안 보낼 내 게시글 선택
          { path: '/board/:postId', element: <SpecificPostsPage /> }, // 게시글 상세
          { path: '/board/:postId/edit', element: <PosteditPage /> }, // 게시글 수정
          // :id 나 :roomId 는 동적 라우팅 기법입니다. (ex. /board/123)
          // 예시: { path: '/board/:id', element: <DetailPage /> },    // 상세 게시글
          { path: '/board/write', element: <PostWritePage /> },
          { path: '/post/:postId', element: <PostDetailPage /> },
          { path: '/lounge/write', element: <LoungeWritePage /> },
          { path: '/course-search', element: <CourseSearchPage /> },
          { path: '/lounge/:postId/edit', element: <PostEditPage /> },
        ],
      },
    ],
  },
]);
