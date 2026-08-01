import React from 'react';
import { createBrowserRouter } from 'react-router-dom';

// --- 1. 레이아웃 불러오기 ---
import RootLayout from '@/components/layout/RootLayout';
import DefaultLayout from '@/components/layout/DefaultLayout';
import FullScreenLayout from '@/components/layout/FullScreenLayout';

// --- 2. 페이지 불러오기 (임시 예시) ---
import LoginPage from '../pages/auth/login';
import SignupPage from '../pages/auth/signup';
import FindPWPage from '../pages/auth/findPW';
import AlertPage from '../pages/alert/alert';
import EPRPage from '../pages/chat/EPR';
import CRPPage from '../pages/chat/CRP';
import SDPPage from '../pages/chat/SDP';
import TDPPage from '../pages/chat/TDP';

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
          // 예시: { path: 'board', element: <BoardPage /> },    // /board (교환게시판)
          { path: '/alert', element: <AlertPage /> },
          { path: '/chat', element: <EPRPage /> },
          // 예시: { path: '/board', element: <BoardPage /> },    // /board (교환게시판)
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
          // 예시: { path: '/board/:id', element: <DetailPage /> },    // 상세 게시글
        ],
      },
    ],
  },
]);
