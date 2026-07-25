import { useState, useEffect, useRef } from 'react';
import { HomeHeader } from '@/pages/home/components/HomeHeader';
import { HomeHero } from '@/pages/home/components/HomeHero';
import { ReceivedRequestCard } from '@/pages/home/components/ReceivedRequestCard';
import { RecommendMatchItem } from '@/pages/home/components/RecommendMatchItem';
import sooWatermark from '@/assets/images/soo-watermark.png';
import { useHomeQuery } from '@/hooks/useHomeQuery';

// 💡 1. 만들어둔 Spinner 컴포넌트를 불러옵니다. (경로는 실제 위치에 맞게 수정해주세요)
import { Spinner } from '@/components/common/Spinner';

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const sensorRef = useRef<HTMLDivElement>(null);

  const { data: homeData, isLoading, isError } = useHomeQuery();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    if (sensorRef.current) observer.observe(sensorRef.current);
    return () => observer.disconnect();
  }, []);

  // 💡 2. 로딩 중일 때 Spinner 컴포넌트를 사용하도록 수정합니다.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9F9F9]">
        <Spinner size="md" />
      </div>
    );
  }

  // 에러 발생 처리 (지금 이 화면이 뜨는게 정상!)
  if (isError || !homeData) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        데이터를 불러오는데 실패했습니다.
      </div>
    );
  }

  const {
    state = 'active',
    userName = '눈송이',
    receivedRequests = [],
    recommendedMatches = [],
  } = homeData;

  return (
    <div className="relative mx-auto w-full max-w-[430px] min-h-screen pb-10 flex flex-col bg-white overflow-x-hidden shadow-2xl">
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
      <div className="absolute top-[100px] left-[60px] w-96 h-48 pointer-events-none z-0 select-none">
        <img
          src={sooWatermark}
          alt="SOO 워터마크"
          className="w-full h-full object-contain opacity-100"
        />
      </div>

      {/* 본문 콘텐츠 영역 */}
      <div className="relative z-10 flex flex-col bg-transparent w-full">
        {/* 헤더 */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
          <HomeHeader isScrolled={isScrolled} />
        </div>

        <div className="px-5 flex flex-col pt-[56px] mt-2">
          {/* 서버 데이터 주입 */}
          <HomeHero state={state} userName={userName} />

          {/* 받은 요청함 */}
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
                  <ReceivedRequestCard key={req.id} {...req} />
                ))}
              </div>
            )}
          </section>

          {/* 추천 매칭 */}
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
                  <RecommendMatchItem key={match.id} {...match} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
