import { useState, useEffect, useRef } from 'react';
import { HomeHeader } from '@/pages/home/components/HomeHeader';
import { HomeHero } from '@/pages/home/components/HomeHero';
import { ReceivedRequestCard } from '@/pages/home/components/ReceivedRequestCard';
import { RecommendMatchItem } from '@/pages/home/components/RecommendMatchItem';
import sooWatermark from '@/assets/images/soo-watermark.png';
import { useHomeQuery } from '@/hooks/home/useHomeQuery';
import { Spinner } from '@/components/common/Spinner';
import { Toast } from '@/components/common/Toast';
import { ICONS } from '@/constants/icons';
import {
  useProposeMutation,
  useAcceptMutation,
  useRejectMutation,
} from '@/hooks/home/useProposals';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const sensorRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    icon: string;
  }>({
    isVisible: false,
    message: '',
    icon: ICONS.CHECK,
  });

  const { data: homeData, isLoading, isError } = useHomeQuery();

  const proposeMutation = useProposeMutation();
  const acceptMutation = useAcceptMutation();
  const rejectMutation = useRejectMutation();

  useEffect(() => {
    if (isLoading || !sensorRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );

    // 센서 감시 시작
    observer.observe(sensorRef.current);

    return () => observer.disconnect();
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9F9F9]">
        <Spinner size="md" />
      </div>
    );
  }

  if (isError || !homeData) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        데이터를 불러오는데 실패했습니다.
      </div>
    );
  }

  const {
    heroBanner,
    receivedProposals = [],
    recommendedFeed,
  } = homeData || {};

  const recommendedMatches = recommendedFeed?.posts || [];
  const receivedRequests = receivedProposals;

  // 상태(state) 직접 계산 로직
  let state: 'empty' | 'active' | 'alert' = 'active';

  if (recommendedMatches.length === 0) {
    state = 'empty'; // 추천 게시글이 없으면 empty
  } else if (heroBanner && heroBanner.remainSeconds > 0) {
    state = 'alert'; // 남은 시간이 있으면 alert (내일 교환)
  }

  // 토스트 띄우기 헬퍼 함수
  const showToast = (message: string, isError = false) => {
    setToast({
      isVisible: true,
      message,
      // 에러 상황이면 경고 아이콘, 성공이면 체크 아이콘 사용 (프로젝트에 맞게 수정)
      icon: isError ? ICONS.WARNING : ICONS.CHECK,
    });
  };

  // 제안하기 핸들러 (React Query 적용)
  const handlePropose = (senderPostId: number, receiverPostId: number) => {
    // 이미 로딩 중이면 중복 클릭 방지
    if (proposeMutation.isPending) return;

    proposeMutation.mutate(
      { senderPostId, receiverPostId },
      {
        onSuccess: () => {
          showToast('교환 제안을 성공적으로 보냈습니다!');
        },
        onError: (error: unknown) => {
          const axiosError = error as {
            response?: { data?: { message?: string } };
          };
          const errorMessage =
            axiosError.response?.data?.message ||
            '제안 처리 중 오류가 발생했습니다.';
          showToast(errorMessage, true);
        },
      },
    );
  };

  // 수락하기 핸들러 (React Query 적용)
  const handleAccept = (proposalId: number) => {
    if (acceptMutation.isPending) return;

    acceptMutation.mutate(proposalId, {
      onSuccess: () => {
        showToast('교환 제안을 수락했습니다!');
      },
      onError: (error: unknown) => {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        const errorMessage =
          axiosError.response?.data?.message ||
          '수락 처리 중 오류가 발생했습니다.';
        showToast(errorMessage, true);
      },
    });
  };

  const handleReject = (proposalId: number) => {
    if (rejectMutation.isPending) return;
    rejectMutation.mutate(proposalId, {
      onSuccess: () => showToast('교환 제안을 거절했습니다.'),
      onError: () => showToast('거절 처리 중 오류가 발생했습니다.', true),
    });
  };

  return (
    <div className="relative mx-auto w-full max-w-[480px] min-h-screen pb-10 flex flex-col bg-white overflow-x-hidden shadow-2xl">
      {/* 화면 맨 위 투명 센서 */}
      <div
        ref={sensorRef}
        className="absolute top-0 left-0 w-full h-[1px] bg-transparent pointer-events-none z-50"
      />

      {/* 배경 레이어 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 240% 100% at 0% 100%, rgba(125,211,252,0.35) 0%, rgba(186,230,253,0.15) 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute -top-[100px] -right-[50px] w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.06]"
          style={{
            background:
              'radial-gradient(circle, #FFECCC 0%, #FFCDB5 50%, transparent 80%)',
          }}
        />
        <div
          className="absolute w-96 h-96 left-[130px] top-[202.75px] origin-top-left -rotate-[62deg] rounded-full blur-[20px] opacity-[0.3]"
          style={{ background: 'linear-gradient(152deg, #E9F2F5, #43A3FF)' }}
        />
      </div>

      {/* 워터마크 */}
      <div className="absolute top-[110px] left-[115px] w-96 h-48 pointer-events-none z-0 select-none">
        <img
          src={sooWatermark}
          alt="SOO 워터마크"
          className="w-full h-full object-contain opacity-100"
        />
      </div>

      {/* 본문 콘텐츠 영역 */}
      <div className="relative z-10 flex flex-col bg-transparent w-full">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50">
          <HomeHeader isScrolled={isScrolled} />
        </div>

        <div className="px-5 flex flex-col pt-[56px] mt-2">
          <HomeHero state={state} heroBanner={heroBanner} />

          <section className="flex flex-col gap-3 mt-8">
            <h2 className="text-[16px] font-bold text-[#5A9ECC]">
              받은 요청함
            </h2>
            {receivedRequests.length === 0 ? (
              <div className="w-full py-14 bg-white/70 rounded-2xl border border-[#C5E4F8] flex justify-center items-center shadow-sm">
                <span className="text-gray-400 text-sm font-medium">
                  아직 받은 요청이 없어요!
                </span>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-5 px-5">
                {receivedRequests.map((req) => (
                  <ReceivedRequestCard
                    key={req.proposalId}
                    {...req}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3 mt-8">
            <h2 className="text-[16px] font-bold text-[#5A9ECC]">추천 매칭</h2>
            {recommendedMatches.length === 0 ? (
              <div className="w-full py-24 bg-white/70 rounded-2xl border border-[#C5E4F8] flex justify-center items-center shadow-sm">
                <span className="text-gray-400 text-sm font-medium">
                  게시글을 등록하면 매칭을 추천 받을 수 있어요
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recommendedMatches.map((match) => (
                  <RecommendMatchItem
                    key={match.id}
                    id={match.id}
                    discardCourse={match.discardCourse}
                    wantedCourses={match.wantedCourses}
                    proposalCount={match.proposalCount}
                    requestStatus={match.requestStatus || null}
                    senderPostId={match.senderPostId}
                    onPropose={handlePropose}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ✨ 토스트 컴포넌트 렌더링 */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        icon={toast.icon}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
