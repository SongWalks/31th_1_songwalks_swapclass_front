import { createBrowserRouter } from 'react-router-dom';

// --- 1. 레이아웃 불러오기 ---
import RootLayout from '@/components/layout/RootLayout';
import DefaultLayout from '@/components/layout/DefaultLayout';
import FullScreenLayout from '@/components/layout/FullScreenLayout';

// --- 2. 페이지 불러오기 ---
import Mypage from '../pages/Mypage/Mypage';
import PasswordChangepage from '../pages/Mypage/PasswordChangepage';
import MyPostpage from '../pages/Mypage/MyPostpage';
import LikeListPage from '@/pages/Mypage/LikeListPage';
import GraduationPage from '@/pages/Mypage/GraduationPage';
import MyLoungePostsPage from '@/pages/Mypage/MyLoungePostsPage';
import MyBookmarkPage from '@/pages/Mypage/MyBookmarkPage';
import GraduationAddPage from '@/pages/Mypage/GraduationAddPage';
import ExchangeRequestPage from '@/pages/Mypage/ExchangeRequestPage';
import ExchangeRequestSpecific from '@/pages/Mypage/ExchangeRequestSpecific';

// import ExchangeRecommendPage from '@/pages/ExchangeRecommendPage/ExchangeRecommendPage';

import { TestButton } from '../pages/TestButton';
import { TestHeader } from '../pages/TestHeader';
import { TestInput } from '../pages/TestInput';
import { TestModal } from '../pages/TestModal';
import { TestTabs } from '../pages/TestTabs';
import { TestCard } from '../pages/TestCard';
import { TestExtra } from '../pages/TestExtra';
import { TestAvatar } from '../pages/TestAvatar';
import { TestLoading } from '../pages/TestLoading';

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
            path: 'my',
            children: [
              { index: true, element: <Mypage /> },
              { path: 'password-change', element: <PasswordChangepage /> },
              { path: 'posts', element: <MyPostpage /> },
              { path: 'likes', element: <LikeListPage /> },
              { path: 'lounge', element: <MyLoungePostsPage /> },
              { path: 'bookmarks', element: <MyBookmarkPage /> },
              // { path: 'recommend', element: <ExchangeRecommendPage /> },

              // 💡 ExchangeRequestPage는 DefaultLayout에 유지 (/my/request)
              { path: 'request', element: <ExchangeRequestPage /> },
            ],
          },
          { path: '/test-input', element: <TestInput /> },
          { path: '/test-modal', element: <TestModal /> },
          { path: '/test-button', element: <TestButton /> },
          { path: '/test-header', element: <TestHeader /> },
          { path: '/test-tabs', element: <TestTabs /> },
          { path: '/test-card', element: <TestCard /> },
          { path: '/test-extra', element: <TestExtra /> },
          { path: '/test-avatar', element: <TestAvatar /> },
          { path: '/test-loading', element: <TestLoading /> },
        ],
      },
      {
        // ==========================================
        // 💡 2번 그룹: 하단 네비게이션이 없는 전체 화면(FullScreen) 화면들
        // ==========================================
        element: <FullScreenLayout />,
        children: [
          {
            path: '/my/graduation',
            children: [
              { index: true, element: <GraduationPage /> },
              { path: 'add', element: <GraduationAddPage /> },
            ],
          },
          {
            // 💡 뚱땅뚱땅 수정할 부분: :proposalId 파라미터 추가!
            path: '/proposal/:proposalId',
            element: <ExchangeRequestSpecific />,
          },
        ],
      },
    ],
  },
]);
