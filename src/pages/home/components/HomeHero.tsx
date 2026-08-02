import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';

interface SimpleCourse {
  name: string;
}

interface HeroBannerData {
  exchangeId: number;
  chatRoomId: number;
  scheduledAt: string;
  remainSeconds: number;
  myCourse: SimpleCourse;
  partnerCourse: SimpleCourse;
}

interface HomeHeroProps {
  state: 'empty' | 'active' | 'alert';
  heroBanner?: HeroBannerData | null;
}

export const HomeHero = ({ state, heroBanner }: HomeHeroProps) => {
  const navigate = useNavigate();

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const calculateDDay = (seconds?: number) => {
    if (seconds === undefined || seconds <= 0) return 'D-Day';
    const days = Math.ceil(seconds / (24 * 3600));
    return `D-${days}`;
  };

  const dDayText = calculateDDay(heroBanner?.remainSeconds);
  const formattedTime = formatTime(heroBanner?.scheduledAt);
  const courseName = heroBanner?.partnerCourse?.name || '과목명 로딩중';

  const hasAppointment = heroBanner != null && heroBanner.remainSeconds > 0;

  const handleButtonClick = () => {
    if (!hasAppointment) {
      navigate('/board');
    } else {
      // TODO: 데이터에 chatRoomId가 있다면 특정 채팅방으로 바로 이동하게 할 수도 있습니다.
      // 예: navigate(`/chat/${heroBanner.chatRoomId}`);
      navigate('/chat');
    }
  };

  return (
    <section className="relative w-full pt-4 pb-6 flex flex-col">
      {/* 마스코트 */}
      <div
        className={`absolute right-[-8px] w-[160px] h-[170px] pointer-events-none z-10 transition-all ${
          state === 'empty'
            ? 'top-[60px]'
            : state === 'alert'
              ? 'top-[40px]'
              : 'top-[50px]'
        }`}
      >
        <img
          src="/src/assets/images/noonsong.png"
          alt="수강구조대 마스코트"
          className="w-full h-full object-contain drop-shadow-md"
        />
      </div>

      {/* 텍스트 영역 */}
      <div
        className={`flex flex-col justify-center min-h-[140px] z-10 pr-[150px] ${
          state === 'empty' ? 'pt-28' : state === 'alert' ? 'pt-14' : 'pt-20'
        }`}
      >
        {/* empty */}
        {state === 'empty' && (
          <>
            <h1 className="text-point-2 !text-[32px] text-brand-navy">
              수강구조대
            </h1>
            <p className="text-medium-15 text-gray-700 mt-2">
              눈송이들의 안전한
              <br />
              수강 교환을 도와드립니다
            </p>
          </>
        )}

        {/* active */}
        {state === 'active' && (
          <>
            {/* 💡 약속이 있을 때만 디데이 뱃지 표시 */}
            {hasAppointment && (
              <span
                className="inline-block px-3 py-0.5 border border-brand-lightBlue
                text-brand-lightBlue rounded-full text-[11px] font-bold w-fit mb-6
                bg-white/60"
              >
                {dDayText}
              </span>
            )}
            <h1 className="text-point-2 !text-[32px] !leading-[31px] font-bold">
              <span className="text-brand-navy">안녕하세요,</span>
              <br />
              <span className="text-brand-blue">송이님!</span>
            </h1>
            <p className="text-gray-700 mt-2 text-medium-15 leading-relaxed">
              원하는 강의를 찾고
              <br />
              안전하게 교환해보세요
            </p>
          </>
        )}

        {/* alert */}
        {state === 'alert' && (
          <>
            <span
              className="inline-block px-3 py-0.5 border border-brand-lightBlue
              text-brand-lightBlue rounded-full text-[11px] font-bold w-fit mb-6
              bg-white/60"
            >
              {dDayText}
            </span>
            <h1 className="text-point-1 text-brand-navy leading-none">
              {formattedTime}
            </h1>
            <p className="text-gray-700 mt-3 text-light-14 leading-relaxed">
              내일{' '}
              <strong className="text-[#0467A7] text-medium-15">
                {courseName}
              </strong>
              <br />
              교환이 있는 날이에요
            </p>
          </>
        )}
      </div>

      {/* 메인 액션 버튼 */}
      <Button
        variant="light"
        size="lg"
        className="mt-9 backdrop-blur-sm border border-[#A8D4EF]/50 !h-[44px]"
        onClick={handleButtonClick}
      >
        {!hasAppointment ? '교환 게시글 둘러보기' : '교환채팅방 입장하기'}
      </Button>
    </section>
  );
};
