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
          // :id 나 :roomId 는 동적 라우팅 기법입니다. (ex. /board/123)
          // 예시: { path: '/board/:id', element: <DetailPage /> },    // 상세 게시글
          {
            path: '/board/:postId/select-my-post',
            element: <SelectMyPostPage />,
          }, // 제안 보낼 내 게시글 선택
          { path: '/board/:postId', element: <SpecificPostsPage /> }, // 게시글 상세

          // 🧪 임시 테스트용 경로 - board 페이지 없이 바로 확인할 때 사용, 나중에 지우세요
          // postId가 없으면 SpecificPostsPage가 자동으로 목업 데이터를 보여줍니다
          { path: '/test-specific-post', element: <SpecificPostsPage /> },
          { path: '/test-select-my-post', element: <SelectMyPostPage /> },
          // { path: '/board/:postId/edit', element: <PostEditPage />},
          { path: '/test-post-edit', element: <PostEditPage /> },
        ],
      },
    ],
  },
]);
