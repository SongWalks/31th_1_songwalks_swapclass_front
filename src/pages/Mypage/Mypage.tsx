import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { Avatar } from '@/components/common/Avatar';
import { Modal } from '@/components/common/Modal';
import { NotificationBell } from '@/components/common/NotificationBell';
import postIcon from '@/assets/icons/mypage/post_icon.svg';
import exchangeIcon from '@/assets/icons/mypage/exchange_recommend_icon.svg';
import likeIcon from '@/assets/icons/mypage/like_icon.svg';
import bookmarkIcon from '@/assets/icons/mypage/bookmark_icon.svg';
import graduationIcon from '@/assets/icons/mypage/graduation_icon.svg';
import chatIcon from '@/assets/icons/mypage/chat_icon.svg';
import lockIcon from '@/assets/icons/mypage/lock_icon.svg';
import logoutIcon from '@/assets/icons/mypage/logout_icon.svg';
import deleteIcon from '@/assets/icons/mypage/delete_icon.svg';
import finalAlertIcon from '@/assets/icons/mypage/final_alert.svg';
import movementIcon from '@/assets/icons/mypage/movement.svg';

// 💡 API 통신 함수들 임포트
import {
  getUserProfile,
  updateNotification,
  deleteAccount,
  type UserProfile,
} from '@/api/mypage/mypageApi';
import axiosInstance from '@/api/axiosInstance';
import { clearTokens } from '@/store/tokenStorage';

interface MenuItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  fontSizeClass: string;
  badge?: string | number;
  onClick?: () => void;
}

const MyPage = () => {
  const navigate = useNavigate();

  // 상태 관리
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAlertOn, setIsAlertOn] = useState(false);

  // 💡 뱃지 상태 관리 (나중에 API 응답 값으로 업데이트 해주세요!)
  const [hasNewRecommend, setHasNewRecommend] = useState<boolean>(false); // 추천 매칭함 new 여부
  const [requestCount, setRequestCount] = useState<number>(0); // 요청함 알림 개수

  // 탈퇴 모달 2가지를 제어하기 위한 상태
  const [isWithdrawBlockModalOpen, setIsWithdrawBlockModalOpen] =
    useState(false); // 교환 진행 중일 때 뜨는 모달
  const [isWithdrawConfirmModalOpen, setIsWithdrawConfirmModalOpen] =
    useState(false); // 최종 확인 모달

  // 탈퇴 시 "교환 중인 게시글이 있는지" 실제로 확인하는 상태
  const [hasOngoingExchange, setHasOngoingExchange] = useState(false);

  // 1. 내 정보 불러오기 API 연동
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getUserProfile();
        if (res.success) {
          setProfile(res.data);
          setIsAlertOn(res.data.notificationEnabled);
        }
      } catch (error) {
        console.error('내 프로필 정보 조회 실패:', error);
      }
    };
    fetchProfile();
  }, []);

  // 💡 탈퇴 시 "교환 중인 게시글이 있는지" 실제로 확인 (예전엔 하드코딩된 true라 항상 떴었음)
  useEffect(() => {
    const checkOngoingExchange = async () => {
      try {
        const response = await axiosInstance.get('/api/posts/me', {
          params: { status: 'IN_EXCHANGE' },
        });
        const posts: { status: string }[] = response.data?.data || [];
        setHasOngoingExchange(posts.length > 0);
      } catch (error) {
        console.error('교환 중인 게시글 확인 실패:', error);
      }
    };
    checkOngoingExchange();
  }, []);

  // 💡 뱃지(받은 요청 개수 / 추천 매칭함 new 여부) 채우기
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      // 받은 요청함 뱃지: PENDING(대기 중) 상태인 것만 개수로 카운트
      try {
        const receivedRes = await axiosInstance.get('/api/proposals/received');
        const received: { status: string }[] = receivedRes.data?.data || [];
        setRequestCount(
          received.filter((item) => item.status === 'PENDING').length,
        );
      } catch (error) {
        console.error('받은 요청 개수 조회 실패:', error);
      }

      // 추천 매칭함 new 뱃지: 아직 요청 안 보낸(requestStatus === 'NONE') 추천이 하나라도 있으면 New
      // 💡 BoardPage/ExchangeRecommendPage와 동일하게 내 게시글(myPostId)이 있어야 조회 가능
      try {
        const myPostsRes = await axiosInstance.get('/api/posts/me', {
          params: { status: 'MATCHABLE' },
        });
        const myPosts: { postId: number; status: string }[] =
          myPostsRes.data?.data || [];
        const myPostId = myPosts.find((p) => p.status === 'MATCHABLE')?.postId;
        if (!myPostId) return;

        const recRes = await axiosInstance.get('/api/matches/recommendations', {
          params: { postId: myPostId, page: 0, size: 20 },
        });
        const recommendations: { requestStatus: string | null }[] =
          recRes.data?.data?.posts || [];
        // 💡 아직 요청 안 보낸 추천은 requestStatus가 'NONE' 문자열이 아니라 null로 옴 (Swagger로 확인함)
        setHasNewRecommend(recommendations.some((item) => !item.requestStatus));
      } catch (error) {
        console.error('추천 매칭함 new 여부 조회 실패:', error);
      }
    };

    fetchBadgeCounts();
  }, []);

  // 2. 알림 설정 토글 API 연동
  const handleToggleNotification = async () => {
    const nextState = !isAlertOn;
    // UI 즉각 반영 (Optimistic Update)
    setIsAlertOn(nextState);
    try {
      const res = await updateNotification(nextState);
      if (!res.success) {
        // 실패 시 원래 상태로 복구
        setIsAlertOn(!nextState);
      }
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      setIsAlertOn(!nextState); // 에러 시 복구
    }
  };

  // 3. 회원 탈퇴 API 연동
  const handleWithdraw = async () => {
    try {
      const res = await deleteAccount();
      if (res.success) {
        alert('회원 탈퇴가 정상적으로 처리되었습니다.');
        clearTokens();
        navigate('/'); // 탈퇴 후 로그인 화면으로 이동
      }
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      alert('회원 탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setIsWithdrawConfirmModalOpen(false);
    }
  };

  // 로그아웃 처리
  const handleLogout = () => {
    if (window.confirm('정말 로그아웃 하시겠습니까?')) {
      clearTokens();
      navigate('/');
    }
  };

  // 교환 활동 섹션
  const exchangeMenus: MenuItem[] = [
    {
      icon: (
        <img
          src={postIcon}
          alt="내 교환 게시글"
          className="w-[18px] h-[18px]"
        />
      ),
      title: '내 교환 게시글',
      description: '등록한 교환 게시글 관리',
      fontSizeClass: 'text-[15px]',
      onClick: () => navigate('/my/posts'),
    },
    {
      icon: (
        <img src={exchangeIcon} alt="교환 추천 매칭함" className="w-6 h-6" />
      ),
      title: '교환 추천 매칭함',
      description: '나에게 맞는 교환 게시글 추천',
      fontSizeClass: 'text-[15px]',
      // 💡 새로운 추천이 있을 때만 'new' 뱃지 표시
      badge: hasNewRecommend ? 'new' : undefined,
      onClick: () => navigate('/my/exchange-recommend'),
    },
    {
      icon: <img src={chatIcon} alt="교환 요청함" className="w-5 h-[19px]" />,
      title: '교환 요청함',
      description: '받은 요청 및 보낸 요청',
      fontSizeClass: 'text-[15px]',
      // 💡 요청이 1개 이상일 때만 숫자 뱃지 표시
      badge: requestCount > 0 ? requestCount : undefined,
      onClick: () => navigate('/my/request'),
    },
    {
      icon: <img src={likeIcon} alt="찜 목록" className="w-5 h-5" />,
      title: '찜 목록',
      description: '관심 있는 교환 게시글 모아보기',
      fontSizeClass: 'text-[15px]',
      onClick: () => navigate('/my/likes'),
    },
    {
      icon: (
        <img
          src={graduationIcon}
          alt="졸업요건 과목 등록"
          className="w-[18px] h-[15px]"
        />
      ),
      title: '졸업요건 과목 등록',
      description: '졸업에 필요한 과목 등록 및 관리',
      fontSizeClass: 'text-[16px]',
      onClick: () => navigate('/my/graduation'),
    },
  ];

  // 라운지 섹션 메뉴
  const loungeMenus: MenuItem[] = [
    {
      icon: <img src={postIcon} alt="내 라운지 게시글" className="size-5" />,
      title: '내 라운지 게시글',
      description: '등록한 라운지 게시글 관리',
      fontSizeClass: 'text-[16px]',
      onClick: () => navigate('/my/lounge'),
    },
    {
      icon: (
        <img src={bookmarkIcon} alt="북마크 목록" className="w-[11px] h-4" />
      ),
      title: '북마크 목록',
      description: '관심있는 라운지 게시글 모아보기',
      fontSizeClass: 'text-[16px]',
      onClick: () => navigate('/my/bookmarks'),
    },
  ];

  // 계정 설정 전용 비밀번호 메뉴 사양
  const passwordMenuIcon = (
    <img src={lockIcon} alt="비밀번호 변경" className="w-6 h-6" />
  );

  const renderMenuItem = (
    item: MenuItem,
    index: number,
    isLast: boolean,
    onClick?: () => void,
  ) => (
    <div
      key={index}
      onClick={onClick}
      className={`flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors ${
        isLast ? '' : 'border-b border-gray-100'
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-full transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center overflow-visible min-w-[40px] min-h-[40px]">
          {item.icon}
        </div>
        <div>
          <h4
            className={`${item.fontSizeClass} font-medium text-black leading-[20px] tracking-[0.08px]`}
          >
            {item.title}
          </h4>
          {item.description && (
            <p className="text-[14px] font-light text-[#61646B] leading-[20px] tracking-[0.4px] mt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {item.badge === 'new' && (
          <span className="w-9 h-5 bg-brand-lightBlue rounded-[20px] text-white text-xs font-normal leading-5 tracking-wide flex items-center justify-center antialiased subpixel-antialiased">
            New
          </span>
        )}
        {typeof item.badge === 'number' && (
          <span className="size-5 bg-brand-lightBlue rounded-full text-white text-xs font-normal leading-5 tracking-wide flex items-center justify-center antialiased subpixel-antialiased">
            {item.badge}
          </span>
        )}
        <img src={movementIcon} alt="이동" className="w-6 h-6" />
      </div>
    </div>
  );

  return (
    <div
      style={{
        fontFamily:
          "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif",
      }}
      className="w-full bg-[#FBFBFB] text-gray-800 flex flex-col antialiased min-h-full relative"
    >
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
      `}</style>

      {/* 헤더 바 */}
      <div className="sticky top-0 z-40 bg-[#FBFBFB]">
        <div className="[&>*]:!border-none">
          <Header
            title={<div className="">마이페이지</div>}
            rightNode={<NotificationBell />}
          />
        </div>
      </div>

      <div className="px-5 pb-12 flex flex-col flex-1">
        {/* 프로필 영역 */}
        <div className="py-6 flex items-center space-x-4 border-b border-gray-100">
          <Avatar size="md" className="!w-[42px] !h-[42px]" />

          <div>
            <h2 className="text-[16px] font-medium text-black leading-[20px] tracking-[0.4px]">
              {profile ? profile.email : '비회원'}
            </h2>
            {profile && (
              <p className="text-[11px] font-normal text-black leading-[20px] tracking-[0.4px] flex items-center gap-1 mt-0.5">
                <Icon
                  icon="mdi:check-circle"
                  className="w-6 h-4 text-brand-lightBlue mt-0.5 shrink-0"
                />
                숙명여자대학교 인증 계정
              </p>
            )}
          </div>
        </div>

        {/* 교환 활동 섹션 */}
        <div className="mt-6">
          <div className="h-5 flex items-center text-slate-500 text-base font-bold leading-5 tracking-wide mb-3">
            교환 활동
          </div>
          <div className="flex flex-col">
            {exchangeMenus.map((menu, idx) =>
              renderMenuItem(
                menu,
                idx,
                idx === exchangeMenus.length - 1,
                menu.onClick,
              ),
            )}
          </div>
        </div>
        <div className="w-full border-b border-gray-200 mt-2" />

        {/* 라운지 섹션 */}
        <div className="mt-6">
          <div className="h-5 flex items-center text-slate-500 text-base font-bold leading-5 tracking-wide mb-3">
            라운지
          </div>
          <div className="flex flex-col">
            {loungeMenus.map((menu, idx) =>
              renderMenuItem(
                menu,
                idx,
                idx === exchangeMenus.length - 1,
                menu.onClick,
              ),
            )}
          </div>
        </div>
        <div className="w-full border-b border-gray-200 mt-2" />

        {/* 계정 설정 섹션 */}
        <div className="mt-6">
          <div className="h-5 flex items-center text-slate-500 text-base font-bold leading-5 tracking-wide mb-3">
            계정
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between py-4 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-brand-lightBlue overflow-visible min-w-[40px] min-h-[40px]">
                  <div className="size-6 relative overflow-visible flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="size-5.5 text-brand-lightBlue"
                    >
                      <path
                        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9zm-4.27 13a2 2 0 0 1-3.46 0"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 className="text-[16px] font-medium text-black leading-[20px] tracking-[0.08px]">
                    알림 받기
                  </h4>
                  <p className="text-[14px] font-light text-[#61646B] leading-[20px] tracking-[0.4px] mt-0.5">
                    교환 요청, 매칭 알림 관리
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleNotification}
                className={`w-[44px] h-[24px] flex items-center rounded-full p-0.5 transition-colors duration-300 ${isAlertOn ? 'bg-brand-lightBlue' : 'bg-gray-300'}`}
              >
                <div
                  className={`bg-white w-[20px] h-[20px] rounded-full shadow transform transition-transform duration-300 ${isAlertOn ? 'translate-x-[20px]' : 'translate-x-0'}`}
                />
              </button>
            </div>
            {renderMenuItem(
              {
                icon: passwordMenuIcon,
                title: '비밀번호 변경',
                description: '',
                fontSizeClass: 'text-[16px]',
              },
              0,
              true,
              () => navigate('/password-change'),
            )}
            <div className="w-full border-b border-[#E6E7EA] mt-2" />
          </div>
        </div>

        {/* 로그아웃 & 회원탈퇴 */}
        <div className="mt-auto pt-10 pb-4 flex flex-col gap-6">
          {/* 로그아웃하기 */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-4 text-left w-full cursor-pointer"
          >
            <div className="min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0">
              <img src={logoutIcon} alt="로그아웃" className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-black text-base font-medium font-['Pretendard'] leading-5 tracking-tight">
                로그아웃하기
              </div>
              <div className="text-neutral-500 text-sm font-light font-['Work_Sans'] leading-5 tracking-tight">
                현재 계정에서 로그아웃합니다
              </div>
            </div>
          </button>

          {/* 회원탈퇴하기 */}
          <button
            onClick={() => {
              if (hasOngoingExchange) {
                setIsWithdrawBlockModalOpen(true);
              } else {
                setIsWithdrawConfirmModalOpen(true);
              }
            }}
            className="flex items-center space-x-4 text-left w-full cursor-pointer"
          >
            <div className="min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0">
              <img src={deleteIcon} alt="회원 탈퇴" className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-black text-base font-medium font-['Pretendard'] leading-5 tracking-tight">
                회원 탈퇴하기
              </div>
              <div className="text-neutral-500 text-sm font-light font-['Work_Sans'] leading-5 tracking-tight">
                회원 탈퇴 후 계정이 삭제됩니다
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 교환 진행 중으로 인한 탈퇴 불가 알림 */}
      <Modal
        isOpen={isWithdrawBlockModalOpen}
        onClose={() => setIsWithdrawBlockModalOpen(false)}
        footer={
          <div className="flex flex-col w-full gap-[8.91px] mt-[21.64px]">
            {/* 교환 중 게시글 삭제하고 탈퇴하기 */}
            <button
              onClick={() => {
                setIsWithdrawBlockModalOpen(false);
                setIsWithdrawConfirmModalOpen(true);
              }}
              className="w-full py-3 px-5 bg-brand-lightBlue rounded-full flex justify-center items-center transition-colors cursor-pointer"
            >
              <span className="text-white text-base font-light font-['Pretendard'] leading-6 tracking-tight">
                교환 중 게시글 삭제하고 탈퇴하기
              </span>
            </button>

            {/* 취소 */}
            <button
              onClick={() => setIsWithdrawBlockModalOpen(false)}
              className="w-full py-3 px-5 rounded-3xl outline outline-[0.50px] outline-offset-[-0.50px] outline-gray-300 flex justify-center items-center transition-colors cursor-pointer"
            >
              <span className="text-cyan-900 text-base font-medium font-['Pretendard'] leading-6 tracking-tight">
                취소
              </span>
            </button>
          </div>
        }
      >
        <div className="w-72 mx-auto text-center text-cyan-1000 text-base font-medium font-['Pretendard'] leading-5 tracking-wide py-4">
          진행 중인 교환이 있습니다.
          <br />
          교환을 완료하거나 취소한 후<br />
          탈퇴할 수 있습니다.
        </div>
      </Modal>

      {/* 최종 회원 탈퇴 확인 창 (오른쪽 시안) */}
      <Modal
        isOpen={isWithdrawConfirmModalOpen}
        onClose={() => setIsWithdrawConfirmModalOpen(false)}
        icon={
          <div className="flex items-center justify-center mb-1">
            <img src={finalAlertIcon} alt="" className="w-[34px] h-[34px]" />
          </div>
        }
        footer={
          <div className="flex w-full gap-3 mt-4">
            <button
              onClick={() => setIsWithdrawConfirmModalOpen(false)}
              className="flex-1 h-11 flex justify-center items-center rounded-full outline outline-1 outline-offset-[-1px] outline-gray-300 bg-white transition-colors cursor-pointer"
            >
              <span className="text-black text-sm font-medium font-['Pretendard'] leading-5 tracking-tight">
                취소
              </span>
            </button>

            <button
              onClick={handleWithdraw}
              className="flex-1 h-11 flex justify-center items-center bg-rose-500 rounded-full transition-colors cursor-pointer"
            >
              <span className="text-white text-sm font-light font-['Pretendard'] leading-5 tracking-tight">
                탈퇴
              </span>
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-2 mt-1">
          <div className="text-center justify-center text-black text-lg font-semibold font-['Pretendard'] leading-5 tracking-wide">
            정말 탈퇴하시겠어요?
          </div>
          <div className="w-full max-w-[24rem] text-center justify-center text-black text-sm font-light font-['Pretendard'] leading-5 tracking-wide">
            탈퇴 시 계정은 삭제되며 복구되지 않습니다.
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyPage;
