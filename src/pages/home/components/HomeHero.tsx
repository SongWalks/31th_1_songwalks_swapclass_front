import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import noonsongImg from '@/assets/images/noonsong.png';

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

  const calculateDDay = (isoString?: string) => {
    if (!isoString) return 'D-Day';

    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 밤 12시(자정)로 기준점 통일

    const targetDate = new Date(isoString);
    targetDate.setHours(0, 0, 0, 0); // 약속일 밤 12시(자정)로 기준점 통일

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24); // 정확한 일(Day) 차이 계산

    if (diffDays <= 0) return 'D-Day';
    return `D-${diffDays}`;
  };

  const dDayText = calculateDDay(heroBanner?.scheduledAt);
  const formattedTime = formatTime(heroBanner?.scheduledAt);
  const courseName = heroBanner?.partnerCourse?.name || '과목명 로딩중';

  const hasAppointment = !!heroBanner;

  const handleButtonClick = () => {
    if (!hasAppointment) {
      navigate('/board');
    } else {
      navigate(`/chat/${heroBanner.chatRoomId}`);
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
          src={noonsongImg}
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
          <div className="relative mt-2">
            {' '}
            {/* 💡 기준점이 되도록 relative 추가 */}
            {/* 💡 약속이 있을 때만 디데이 뱃지 표시 (absolute로 띄움) */}
            {hasAppointment && (
              <span
                className="absolute bottom-full left-0 mb-4 inline-block px-3 py-0.5 border border-brand-lightBlue
                text-brand-lightBlue rounded-full text-[11px] font-bold w-fit
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
          </div>
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
              {/* 💡 dDayText가 'D-Day'면 '오늘', 아니면 '내일'로 렌더링! */}
              {dDayText === 'D-Day' ? '오늘' : '내일'}{' '}
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
