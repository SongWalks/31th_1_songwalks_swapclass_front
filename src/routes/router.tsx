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
import ReportPage from '@/pages/report/ReportPage';
import ReportSuccessPage from '@/pages/report/ReportSuccessPage';
import ExchangeRecommendPage from '@/pages/ExchangeRecommendPage/ExchangeRecommendPage';
import SpecificPostsPage from '@/pages/ExchangeRecommendPage/SpecificPostsPage';
import SelectMyPostPage from '@/pages/ExchangeRecommendPage/SelectMyPostPage';
import PosteditPage from '@/pages/ExchangeRecommendPage/PosteditPage';
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
          { path: '/alert', element: <AlertPage /> },
          { path: '/chat', element: <EPRPage /> },
          { path: '/', element: <HomePage /> },
          {
            //나중에 다 머지한 뒤에 라우터 수정
            path: 'my/exchange-recommend',
            element: <ExchangeRecommendPage />,
          },
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
          { path: '/board', element: <BoardPage /> },
          { path: '/lounge', element: <LoungePage /> },
        ],
      },
      {
        // ==========================================
        // 💡 2번 그룹: 하단 네비게이션이 없는 전체 화면(FullScreen) 화면들
        // ==========================================
        element: <FullScreenLayout />,
        children: [
          { path: '/report', element: <ReportPage /> },
          { path: '/report/success', element: <ReportSuccessPage /> }, // 신고 완료 페이지 (임시)
          {
            path: '/board/:postId/select-my-post',
            element: <SelectMyPostPage />,
          }, // 제안 보낼 내 게시글 선택
          { path: '/board/:postId', element: <SpecificPostsPage /> }, // 게시글 상세
          { path: '/board/:postId/edit', element: <PosteditPage /> }, // 게시글 수정
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
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
          { path: '/findPW', element: <FindPWPage /> },
          { path: '/chat/:roomId', element: <CRPPage /> },
          { path: '/chat/:roomId/schedule', element: <SDPPage /> },
          { path: '/chat/:roomId/terminate', element: <TDPPage /> },
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
