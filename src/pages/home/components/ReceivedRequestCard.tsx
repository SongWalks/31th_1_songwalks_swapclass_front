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
}

export const ReceivedRequestCard = ({
  myCourse,
  partnerCourse,
  remainSeconds,
}: RequestCardProps) => {
  const formatRemainTime = (seconds: number) => {
    if (seconds <= 0) return '만료됨';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    // 1시간 이상 남았을 때는 시간과 분만 표시
    if (h > 0) return `${h}h ${m}m`;

    return `${m}m ${s}s`;
  };

  const isUrgent = remainSeconds > 0 && remainSeconds < 600;

  const timeText = formatRemainTime(remainSeconds);
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
        <span>{timeText}</span>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button
          variant={isUrgent ? 'warning' : 'primary'}
          size="md"
          fullWidth={false}
          className="flex-1 h-[30px] !rounded-[5px] !text-regular-14"
        >
          수락
        </Button>
        <Button
          variant="outline"
          size="md"
          fullWidth={false}
          className="flex-1 h-[30px] !rounded-[5px] !text-gray-500 !border-gray-200 !text-regular-14"
        >
          거절
        </Button>
      </div>
    </div>
  );
};
