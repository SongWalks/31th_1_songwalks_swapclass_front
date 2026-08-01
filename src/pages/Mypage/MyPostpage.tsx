import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import { EmptyState } from '@/components/common/EmptyState';
import axiosInstance from '@/api/axiosInstance'; // 💡 API 통신용 인스턴스 추가
import { NotificationBell } from '@/components/common/NotificationBell';

type TabType = '전체' | '교환 전' | '교환 중' | '교환 완료';

// 💡 프론트엔드 UI용 게시글 데이터 인터페이스
interface Post {
  id: number;
  title: string;
  preferredSubjects: string[];
  status: TabType;
  requestCount: number;
}

const MyPostpage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('전체');

  // 💡 상태 관리 추가 (게시글 데이터 및 로딩 상태)
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const tabs: TabType[] = ['전체', '교환 전', '교환 중', '교환 완료'];

  // 💡 API 연동: 내 교환 게시글 목록 불러오기
  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        setIsLoading(true);
        // 💡 다른 화면들(ExchangeRecommendPage, BoardPage)에서 확인된 실제 엔드포인트로 맞췄어요.
        const response = await axiosInstance.get('/api/posts/me');

        if (response.data?.success && response.data?.data) {
          // 백엔드 데이터를 프론트 UI 구조에 맞게 매핑
          const mappedPosts: Post[] = response.data.data.map((item: any) => {
            // 💡 서버의 영문 상태값(status)을 한글 탭 메뉴(TabType)에 맞게 변환
            let mappedStatus: TabType = '교환 전';
            if (item.status === 'IN_EXCHANGE') mappedStatus = '교환 중';
            if (item.status === 'COMPLETED') mappedStatus = '교환 완료';
            else if (
              item.status === '교환 전' ||
              item.status === '교환 중' ||
              item.status === '교환 완료'
            ) {
              mappedStatus = item.status; // 서버가 이미 한글로 준다면 그대로 사용
            }

            return {
              id: item.postId || item.id,
              title: item.discardCourse?.name || '과목명 없음',
              preferredSubjects:
                item.wantedCourses?.map((w: any) => w.course.name) || [],
              status: mappedStatus,
              requestCount: item.proposalCount || 0, // 💡 백엔드가 proposalCount로 내려줌 (requestCount 아님)
            };
          });
          setPosts(mappedPosts);
        }
      } catch (error) {
        console.error('내 게시글 목록을 불러오지 못했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

  // 💡 선택한 탭에 따라 데이터 필터링
  const filteredPosts = posts.filter((post) => {
    if (activeTab === '전체') return true;
    return post.status === activeTab;
  });

  return (
    <div className="w-full min-h-screen bg-[#FBFBFB] flex flex-col font-['Pretendard']">
      {/* 헤더 바 */}
      <div className="sticky top-0 z-40 bg-[#FBFBFB] [&>header]:!border-none">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={
            <div className="whitespace-nowrap transform text-black/70 text-xl font-semibold leading-5 tracking-wide">
              내 게시글
            </div>
          }
          rightNode={<NotificationBell />}
        />

        {/* 탭 메뉴 */}
        <div className="flex border-b border-gray-200 bg-[#FBFBFB]">
          {tabs.map((tab) => {
            // 각 탭에 해당되는 데이터 개수 계산
            const count =
              tab === '전체'
                ? posts.length
                : posts.filter((p) => p.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-[15px] font-light transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === tab
                    ? 'text-brand-lightBlue border-b-2 border-brand-lightBlue'
                    : 'text-gray-400 hover:text-gray-500'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-xs font-light leading-5 tracking-wide ${
                    activeTab === tab ? 'text-brand-lightBlue' : 'text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 게시글 목록 영역 */}
      <div className="flex-1 px-8 py-2">
        {isLoading ? (
          <div className="flex h-[60vh] items-center justify-center text-gray-400 text-sm">
            게시글을 불러오는 중입니다...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center">
            <EmptyState
              className="min-h-0"
              title="아직 등록한 교환 게시글이 없어요."
              description="교환하려는 과목을 등록하고 원하는 과목을 찾아보세요!"
            />
          </div>
        ) : (
          <div className="flex flex-col split-y divide-y divide-gray-100">
            {filteredPosts.map((post) => {
              // 💡 상태별 테마 색상 정의 (교환완료는 회색조)
              const isCompleted = post.status === '교환 완료';
              const isOngoing = post.status === '교환 중';

              const badgeBgColor = isCompleted
                ? 'bg-[#E6E7EA]'
                : isOngoing
                  ? 'bg-[#4C9DD1]'
                  : 'bg-[#4C9DD1]'; // 교환 전

              const badgeTextColor = isCompleted
                ? 'text-[#8E939E]'
                : 'text-white';
              const numberBadgeBg = isCompleted
                ? 'bg-[#E6E7EA]'
                : 'bg-[#D2EBFC]';
              const numberBadgeText = isCompleted
                ? 'text-[#8E939E]'
                : 'text-[#4C9DD1]';
              const titleColor = isCompleted ? 'text-black/40' : 'text-black';
              const subjectColor = isCompleted
                ? 'text-black/30'
                : 'text-black/70';

              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/board/${post.id}`)}
                  className="py-6 flex flex-col relative cursor-pointer"
                >
                  {/* 상단 라인: 과목 타이틀 & 상태 배지 */}
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-lg font-semibold leading-5 tracking-wide ${titleColor}`}
                    >
                      {post.title}
                    </h3>
                    <div
                      className={`px-3 py-1 rounded-2xl text-xs font-medium leading-4 tracking-wide ${badgeBgColor} ${badgeTextColor}`}
                    >
                      {post.status}
                    </div>
                  </div>

                  {/* 중단 라인: 희망 1, 2, 3순위 과목 리스트 */}
                  <div className="mt-3 flex flex-col gap-2">
                    {post.preferredSubjects.map((sub, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {/* 1, 2, 3 번호 배지 */}
                        <div
                          className={`w-[14px] h-[14px] rounded-full flex items-center justify-center text-[10px] font-medium leading-none ${numberBadgeBg} ${numberBadgeText}`}
                        >
                          {index + 1}
                        </div>
                        <span
                          className={`text-xs font-light leading-5 tracking-wide ${subjectColor}`}
                        >
                          {sub}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 하단 라인: 받은 요청 수 & 이동 화살표 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/my/request', {
                        state: { initialTab: 'received' },
                      });
                    }}
                    className="self-end mt-2 flex items-center gap-1 hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                  >
                    <span className="text-neutral-500 text-xs font-light leading-5 tracking-tight">
                      받은 요청 {post.requestCount}개
                    </span>
                    {/* 피그마 꺾쇠(Arrow) 아이콘 디자인 그대로 SVG 반영 */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-neutral-400 transform"
                    >
                      <path
                        d="M8.59063 18.1598L14.2506 12.4998L8.59063 6.83984L7.89062 7.54984L12.8406 12.4998L7.89062 17.4498L8.59063 18.1598Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 플로팅 버튼 */}
      <button
        className="fixed bottom-32 right-5 w-14 h-14 bg-[#4C9DD1] rounded-full shadow-lg flex items-center justify-center text-white z-50 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        onClick={() => navigate('/board/write')}
      >
        <div className="w-12 h-12 flex items-center justify-center relative">
          <div className="w-[3.13px] h-5 absolute bg-white rounded-full" />
          <div className="w-5 h-[3.13px] absolute bg-white rounded-full" />
        </div>
      </button>
    </div>
  );
};

export default MyPostpage;
