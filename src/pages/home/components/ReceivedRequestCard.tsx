import { useState, useEffect } from 'react'; // 🚀 1. 훅 추가
import { Icon } from '@iconify/react';
import Button from '@/components/common/Button';

interface Course {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
}

interface RequestCardProps {
  proposalId: number;
  myCourse: Course;
  partnerCourse: Course;
  matchRank: number;
  expiresAt: string;
  remainSeconds: number;
  onAccept?: (proposalId: number) => void;
  onReject?: (proposalId: number) => void;
}

export const ReceivedRequestCard = ({
  proposalId,
  myCourse,
  partnerCourse,
  remainSeconds,
  onAccept,
  onReject,
}: RequestCardProps) => {
  // 1. 현재 남은 시간 상태
  const [timeLeft, setTimeLeft] = useState(remainSeconds);

  // 2. 부모로부터 받은 '이전' remainSeconds를 기억하기 위한 상태
  const [prevRemain, setPrevRemain] = useState(remainSeconds);

  // 3. 경고가 나던 useEffect 대신, 렌더링 과정에서 직접 값을 비교해서 업데이트! (React 공식 권장 방식)
  if (remainSeconds !== prevRemain) {
    setPrevRemain(remainSeconds); // 이전 값 갱신
    setTimeLeft(remainSeconds); // 타이머 리셋
  }

  // 4. 타이머 돌리는 useEffect는 그대로 유지
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatRemainTime = (seconds: number) => {
    if (seconds <= 0) return '만료됨';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    // 시간이 1시간 이상 남았을 때는 시간/분만 표시
    if (h > 0) return `${h}h ${m}m`;

    return `${m}m ${s}s`;
  };

  // 5. prop인 remainSeconds 대신 내부 상태인 timeLeft를 기준으로 화면을 그림
  const isUrgent = timeLeft > 0 && timeLeft < 600; // 10분 미만

  const timeText = formatRemainTime(timeLeft);
  const borderClass = isUrgent ? 'border-[#F2994A]' : 'border-[#8FB6D9]';
  const accentClass = isUrgent ? 'text-[#F2994A]' : 'text-[#5A9ECC]';

  return (
    <div
      className={`flex flex-col shrink-0 w-[200px] h-[210px] bg-white
      rounded-[10px] border-[1.5px] p-4 snap-center ${borderClass}`}
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
    >
      <h3 className="text-gray-900 text-semibold-18 mb-2 truncate">
        {partnerCourse?.name || '알 수 없는 과목'}
      </h3>
      <p className="text-gray-400 text-light-13 truncate">
        ↔ {myCourse?.name || '알 수 없는 과목'}
      </p>

      {/* 타이머 영역 */}
      <div
        className={`flex justify-end items-center gap-1
        text-semibold-16 mt-auto mb-3 ${accentClass}`}
      >
        <Icon icon="ph:clock-bold" className="translate-y-[1px]" />
        {/* 애니메이션 효과를 위해 고정 폭을 주면 더 깔끔할 수 있습니다 */}
        <span className="tabular-nums">{timeText}</span>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button
          variant={isUrgent ? 'warning' : 'primary'}
          size="md"
          fullWidth={false}
          className="flex-1 h-[30px] !rounded-[5px] !text-regular-14"
          onClick={() => onAccept && onAccept(proposalId)}
          // 시간이 만료되면 버튼을 비활성화하는 것도 좋은 디테일입니다
          disabled={timeLeft <= 0}
        >
          수락
        </Button>
        <Button
          variant="outline"
          size="md"
          fullWidth={false}
          className="flex-1 h-[30px] !rounded-[5px] !text-gray-500 !border-gray-200 !text-regular-14"
          onClick={() => onReject && onReject(proposalId)}
          disabled={timeLeft <= 0}
        >
          거절
        </Button>
      </div>
    </div>
  );
};
