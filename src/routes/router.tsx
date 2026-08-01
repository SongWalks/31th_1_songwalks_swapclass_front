import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

// --- 1. 레이아웃 불러오기 ---
import RootLayout from '@/components/layout/RootLayout';
import DefaultLayout from '@/components/layout/DefaultLayout';
import FullScreenLayout from '@/components/layout/FullScreenLayout';

// --- 2. 페이지 불러오기 (임시 예시) ---
import { TestButton } from '../pages/TestButton';
import { TestHeader } from '../pages/TestHeader';
import { TestInput } from '../pages/TestInput';
import { TestModal } from '../pages/TestModal';
import { TestTabs } from '../pages/TestTabs';
import { TestCard } from '../pages/TestCard';
import { TestExtra } from '../pages/TestExtra';
import { TestAvatar } from '../pages/TestAvatar';
import { TestLoading } from '../pages/TestLoading';
import LoginPage from '../pages/auth/login';
import SignupPage from '../pages/auth/signup';
import FindPWPage from '../pages/auth/findPW';
import AlertPage from '../pages/alert';
import EPRPage from '../pages/epr';
import CRPPage from '../pages/chat/crp';
import SDPPage from '../pages/chat/sdp';
import TDPPage from '../pages/chat/tdp';

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
          { path: '/test-input', element: <TestInput /> },
          { path: '/test-modal', element: <TestModal /> },
          { path: '/test-button', element: <TestButton /> },
          { path: '/test-header', element: <TestHeader /> },
          { path: '/test-tabs', element: <TestTabs /> },
          { path: '/test-card', element: <TestCard /> },
          { path: '/test-extra', element: <TestExtra /> },
          { path: '/test-avatar', element: <TestAvatar /> },
          { path: '/test-loading', element: <TestLoading /> },
          { path: '/alert', element: <AlertPage /> },
          { path: '/chat', element: <EPRPage /> },
        ],
      },
      {
        // ==========================================
        // 💡 2번 그룹: 하단 바 없이 전체 화면을 쓰는 화면들
        // ==========================================
        element: <FullScreenLayout />,
        children: [
          // :id 나 :roomId 는 동적 라우팅 기법입니다. (ex. /board/123)
          // 예시: { path: 'board/:id', element: <DetailPage /> },    // 상세 게시글
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
          { path: '/findPW', element: <FindPWPage /> },
          { path: '/chat/:roomId', element: <CRPPage /> },
          { path: '/chat/:roomId/schedule', element: <SDPPage /> },
          { path: '/chat/:roomId/terminate', element: <TDPPage /> },
        ],
      },
    ],
  },
]);
