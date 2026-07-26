import { Icon } from '@iconify/react';

// 백엔드 명세에 맞춘 타입 선언
interface Course {
  courseId: number;
  name: string;
}

interface WantedCourse {
  priority: number;
  course: Course;
}

// 기존 subject, targetSubject 대신 백엔드 데이터 구조로 변경
interface MatchItemProps {
  postId: number;
  discardCourse: Course;
  wantedCourses: WantedCourse[];
  proposalCount: number;
  createdAt: string;
}

export const RecommendMatchItem = ({
  discardCourse,
  wantedCourses,
  createdAt,
}: MatchItemProps) => {
  // 작성일자를 시간 텍스트로 변환
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  const timeText = formatTimeAgo(createdAt);
  const wantedCourseName = wantedCourses?.[0]?.course?.name || '아무거나';

  return (
    <div
      className="flex justify-between items-center px-4 py-3.5
      bg-white rounded-2xl border border-[#C5E4F8]"
      style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
    >
      <div className="flex flex-col gap-1 overflow-hidden pr-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#5A9ECC] shrink-0" />
          <h3 className="font-bold text-gray-900 text-medium-14 truncate">
            {discardCourse?.name}
          </h3>
        </div>
        <p className="text-gray-400 text-light-13 ml-3.5 truncate">
          ↔ {wantedCourseName}
        </p>
      </div>

      <div className="flex items-center gap-1 text-gray-700 shrink-0">
        <Icon icon="ph:clock" className="text-base translate-y-[1px]" />
        <span className="font-bold text-[14px]">{timeText}</span>
      </div>
    </div>
  );
};
