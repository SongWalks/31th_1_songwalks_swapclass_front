import { createBrowserRouter } from 'react-router-dom';

// --- 1. 레이아웃 불러오기 ---
import RootLayout from '@/components/layout/RootLayout';
import DefaultLayout from '@/components/layout/DefaultLayout';
import FullScreenLayout from '@/components/layout/FullScreenLayout';

// --- 2. 페이지 불러오기  ---
import HomePage from '@/pages/home/HomePage';
import ReportPage from '@/pages/report/ReportPage';
import ReportSuccessPage from '@/pages/report/ReportSuccessPage';
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
          { path: '/', element: <HomePage /> },
          { path: '/lounge', element: <LoungePage /> },
        ],
      },
      {
        // ==========================================
        // 💡 2번 그룹: 하단 바 없이 전체 화면을 쓰는 화면들
        // ==========================================
        element: <FullScreenLayout />,
        children: [
          { path: '/report', element: <ReportPage /> },
          { path: '/report/success', element: <ReportSuccessPage /> }, // 신고 완료 페이지 (임시)
          { path: '/post/:postId', element: <PostDetailPage /> },
          { path: '/lounge/write', element: <LoungeWritePage /> },
          { path: '/course-search', element: <CourseSearchPage /> },
          { path: '/lounge/:postId/edit', element: <PostEditPage /> },
        ],
      },
    ],
  },
]);
