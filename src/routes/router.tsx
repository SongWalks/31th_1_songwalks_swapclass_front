import { createBrowserRouter } from 'react-router-dom';

// --- 1. 레이아웃 불러오기 ---
import RootLayout from '@/components/layout/RootLayout';
import DefaultLayout from '@/components/layout/DefaultLayout';
import FullScreenLayout from '@/components/layout/FullScreenLayout';

// --- 2. 페이지 불러오기  ---
import ExchangeRecommendPage from '@/pages/ExchangeRecommendPage/ExchangeRecommendPage';
import SpecificPostsPage from '@/pages/ExchangeRecommendPage/SpecificPostsPage';
import SelectMyPostPage from '@/pages/ExchangeRecommendPage/SelectMyPostPage';
import PostEditPage from '@/pages/ExchangeRecommendPage/PosteditPage';

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
          // 예시: { path: '/board', element: <BoardPage /> },    // /board (교환게시판)

          {
            //나중에 다 머지한 뒤에 라우터 수정
            path: 'my/exchange-recommend',
            element: <ExchangeRecommendPage />,
          },
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
          { path: '/board/:postId/edit', element: <PostEditPage /> }, // 게시글 수정
        ],
      },
    ],
  },
]);
