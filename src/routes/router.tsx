import { createBrowserRouter } from 'react-router-dom';

// --- 1. 레이아웃 불러오기 ---
import RootLayout from '@/components/layout/RootLayout';
import DefaultLayout from '@/components/layout/DefaultLayout';
import FullScreenLayout from '@/components/layout/FullScreenLayout';

// --- 2. 페이지 불러오기  ---

import HomePage from '@/pages/home/HomePage';

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
          // 예시: { path: 'board', element: <BoardPage /> },    // /board (교환게시판)
          { path: '/', element: <HomePage /> },
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
        ],
      },
    ],
  },
]);
