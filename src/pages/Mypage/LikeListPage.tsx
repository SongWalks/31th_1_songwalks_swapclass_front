import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import { Tabs } from '../../components/common/Tabs';
import { EmptyState } from '../../components/common/EmptyState';
import { Toast } from '@/components/common/Toast';
import { getLikePosts, deleteLikePost } from '@/api/mypage/likeApi';
import { NotificationBell } from '@/components/common/NotificationBell';
import redHeartIcon from '@/assets/icons/mypage/red_heart.svg';
import grayHeartIcon from '@/assets/icons/mypage/gray_heart.svg';
import { Icon } from '@iconify/react';

interface CourseInfo {
  courseId: number;
  name: string;
  professor?: string;
  classTime?: string;
  department?: string;
  courseType?: string;
}

interface WantedCourseItem {
  priority: number;
  course: CourseInfo;
}

interface WishPostItem {
  postId: number;
  status: 'MATCHABLE' | 'CLOSED' | string;
  blinded: boolean;
  blindReason?: 'DELETED' | 'MATCHED' | string;
  discardCourse: CourseInfo;
  wantedCourses: WantedCourseItem[];
  requestCount?: number;
  likedAt?: string;
}

const LikeListPage = () => {
  const navigate = useNavigate();
  const [activeTabId, setActiveTabId] = useState<string>('모집중');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [wishPosts, setWishPosts] = useState<WishPostItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [unlikedPostIds, setUnlikedPostIds] = useState<number[]>([]);
  const [showToast, setShowToast] = useState<boolean>(false);

  const tabs = [
    { id: '모집중', label: '모집중' },
    { id: '마감', label: '마감' },
  ];

  // GET /api/me/likes API 연동
  useEffect(() => {
    const fetchLikePosts = async () => {
      try {
        const data = await getLikePosts();
        if (data.success) {
          setWishPosts(data.data);
        }
      } catch (error) {
        console.error('찜 목록을 불러오는데 실패했습니다.', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikePosts();
  }, []);

  const handleToggleLike = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    if (unlikedPostIds.includes(postId)) return;

    try {
      const data = await deleteLikePost(postId);

      if (data.success) {
        setUnlikedPostIds((prev) => [...prev, postId]);
        setShowToast(true);

        setTimeout(() => {
          setWishPosts((prev) => prev.filter((item) => item.postId !== postId));
          setUnlikedPostIds((prev) => prev.filter((id) => id !== postId));
        }, 500);
      }
    } catch (error) {
      console.error('찜 취소 처리에 실패했습니다.', error);
    }
  };

  // 탭 상태(모집중/마감)와 검색어 모두를 고려한 필터링 로직
  const filteredPosts = wishPosts.filter((post) => {
    const matchesTab =
      activeTabId === '모집중'
        ? post.status === 'MATCHABLE'
        : post.status !== 'MATCHABLE';

    if (!matchesTab) return false;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      post.discardCourse?.name.toLowerCase().includes(query) ||
      post.wantedCourses?.some((w) =>
        w.course?.name.toLowerCase().includes(query),
      );

    return matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-[#FBFBFB] flex flex-col font-['Pretendard'] relative pb-20">
      {/* 1. 헤더 & 탭 */}
      <div className="sticky top-0 z-40 bg-[#FBFBFB]">
        <div className="[&>header]:!border-none">
          <Header
            leftNode={
              <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
            }
            title={
              <div className="whitespace-nowrap transform text-black/70 text-xl font-semibold leading-5 tracking-wide">
                찜 목록
              </div>
            }
            rightNode={<NotificationBell />}
          />
        </div>

        <Tabs
          tabs={tabs}
          activeTabId={activeTabId}
          onTabChange={(id) => setActiveTabId(id)}
          variant="line"
        />
      </div>

      {/* 2. 검색 인풋 */}
      <div className="px-5 pt-4 pb-2 bg-[#FBFBFB]">
        <div className="w-full h-11 bg-white rounded-3xl border border-gray-200 px-5 flex items-center justify-between">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력해주세요"
            className="flex-1 bg-transparent border-none outline-none text-sm font-light text-black placeholder-neutral-400 leading-5 tracking-wide"
          />
          <Icon
            icon={ICONS.SEARCH}
            className="w-[18px] h-[18px] cursor-pointer"
          />
        </div>
      </div>

      {/* 3. 리스트 영역 */}
      <div className="flex-1 px-5 pt-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-40 text-neutral-400 text-sm">
            목록을 불러오는 중입니다...
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            title="아직 찜한 교환 게시글이 없어요."
            description={`교환하려는 과목을 등록하고\n원하는 과목을 찾아보세요!`}
            className="h-[50vh] justify-center"
            action={
              <button
                onClick={() => navigate('/board')}
                className="text-brand-lightBlue text-base font-medium underline leading-5 tracking-wide hover:opacity-80 transition-opacity"
              >
                교환 게시판가기 &gt;
              </button>
            }
          />
        ) : (
          <div className="flex flex-col divide-y divide-gray-200 pb-10">
            {filteredPosts.map((post) => {
              const isBlind = post.blinded;
              const isUnliking = unlikedPostIds.includes(post.postId);
              const isGrayedOut = isBlind || isUnliking;

              const titleColor = isGrayedOut
                ? 'text-neutral-400 !tracking-tight'
                : 'text-black !tracking-tight';
              const badgeBgColor = isGrayedOut
                ? 'bg-neutral-400'
                : 'bg-blue-100';
              const badgeTextColor = isGrayedOut
                ? 'text-black/60'
                : 'text-black/60';
              const subTextColor = isGrayedOut
                ? 'text-neutral-400 !tracking-tight'
                : 'text-black/70 !tracking-tight';

              return (
                <div
                  key={post.postId}
                  onClick={() => {
                    if (!isGrayedOut) navigate(`/board/${post.postId}`);
                  }}
                  className={`py-5 relative flex flex-col transition-all duration-300 ${
                    isGrayedOut
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer hover:bg-black/[0.01]'
                  }`}
                >
                  {/* 상단: 버리는 과목명 + 하트 아이콘 */}
                  <div className="flex items-start justify-between mb-3">
                    <h3
                      className={`text-lg font-medium leading-5 tracking-wide transition-colors ${titleColor}`}
                    >
                      {post.discardCourse?.name}
                    </h3>

                    {/* 하트 아이콘 (블라인드된 게시글은 무조건 회색 하트) */}
                    <button
                      onClick={(e) => handleToggleLike(e, post.postId)}
                      disabled={isGrayedOut}
                      className="p-1 -mr-1 transition-transform active:scale-95 disabled:active:scale-100 z-10"
                      aria-label="찜 해제"
                    >
                      <img
                        src={isGrayedOut ? grayHeartIcon : redHeartIcon}
                        alt="Heart"
                        className="w-[22px] h-[22px]"
                      />
                    </button>
                  </div>

                  {/* 중단: 희망 과목 리스트 */}
                  <div className="flex flex-col gap-1.5 pl-0.5 relative">
                    {post.wantedCourses?.map((item) => (
                      <div
                        key={item.priority}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8.5px] font-light shrink-0 transition-colors ${badgeBgColor} ${badgeTextColor}`}
                        >
                          {item.priority}
                        </div>
                        <span
                          className={`text-xs font-light leading-5 tracking-wide transition-colors ${subTextColor}`}
                        >
                          {item.course?.name}
                        </span>
                      </div>
                    ))}

                    {/* 일반 상태: "받은 요청 N개 >" */}
                    {!isBlind && post.requestCount && !isUnliking && (
                      <div className="absolute right-0 bottom-0 flex items-center text-xs font-light tracking-wide text-neutral-400 cursor-pointer">
                        받은 요청 {post.requestCount}개
                        <svg
                          className="w-3 h-3 ml-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}

                    {/* 교환 완료 및 삭제된 게시글 뱃지 */}
                    {isBlind && (
                      <div className="absolute right-0 bottom-0 px-4 h-7 flex items-center justify-center bg-gray-200 rounded-[20px] border-[0.5px] border-neutral-500">
                        <span className="text-neutral-500 text-xs font-light tracking-wide">
                          {post.blindReason === 'DELETED'
                            ? '삭제된 게시글'
                            : '교환 완료된 게시글'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Toast
        message="찜 목록에서 삭제되었습니다."
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={5000}
      />
    </div>
  );
};

export default LikeListPage;
