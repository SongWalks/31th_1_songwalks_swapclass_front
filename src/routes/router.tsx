import { createBrowserRouter } from 'react-router-dom';

// --- 1. 레이아웃 불러오기 ---
import RootLayout from '@/components/layout/RootLayout';
import DefaultLayout from '@/components/layout/DefaultLayout';
import FullScreenLayout from '@/components/layout/FullScreenLayout';
<<<<<<< HEAD

// 💡 마이페이지
import Mypage from '@/pages/Mypage/Mypage';
import PasswordChangepage from '@/pages/Mypage/PasswordChangepage';
import MyPostpage from '@/pages/Mypage/MyPostpage';
import LikeListPage from '@/pages/Mypage/LikeListPage';
import GraduationPage from '@/pages/Mypage/GraduationPage';
import GraduationAddPage from '@/pages/Mypage/GraduationAddPage';
import MyLoungePostsPage from '@/pages/Mypage/MyLoungePostsPage';
import MyBookmarkPage from '@/pages/Mypage/MyBookmarkPage';
import ExchangeRequestPage from '@/pages/Mypage/ExchangeRequestPage';
import ExchangeRequestSpecific from '@/pages/Mypage/ExchangeRequestSpecific';

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
            path: 'my',
            children: [
              { index: true, element: <Mypage /> },
              { path: 'password-change', element: <PasswordChangepage /> },
              { path: 'posts', element: <MyPostpage /> },
              { path: 'likes', element: <LikeListPage /> },
              { path: 'lounge', element: <MyLoungePostsPage /> },
              { path: 'bookmarks', element: <MyBookmarkPage /> },
              { path: 'request', element: <ExchangeRequestPage /> },
            ],
          },

     
          { path: '/board', element: <BoardPage /> }, // /board (교환게시판)
          { path: '/lounge', element: <LoungePage /> },

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
              { path: 'modify', element: <GraduationAddPage /> },
            ],
          },
          { path: '/lounge', element: <LoungePage /> },
          {
            path: '/proposal/:proposalId',
            element: <ExchangeRequestSpecific />,
          },

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
