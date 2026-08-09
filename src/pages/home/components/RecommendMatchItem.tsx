interface Course {
  courseId: number;
  name: string;
}

interface WantedCourse {
  priority: number;
  course: Course;
}

interface MatchItemProps {
  id: number;
  discardCourse: Course;
  wantedCourses: WantedCourse[];
  proposalCount: number;

  senderPostId: number;
  // 백엔드 명세에 맞게 타입 지정: PENDING이거나 null
  requestStatus: 'PENDING' | null;

  onPropose?: (senderPostId: number, receiverPostId: number) => void;
}

export const RecommendMatchItem = ({
  id,
  discardCourse,
  wantedCourses,
  senderPostId,
  requestStatus,
  onPropose,
}: MatchItemProps) => {
  const wantedCourseName = wantedCourses?.[0]?.course?.name || '아무거나';

  // 상태가 PENDING이면 이미 요청한 상태
  const isAlreadyRequested = requestStatus === 'PENDING';

  return (
    <div
      onClick={() => {
        if (!isAlreadyRequested && onPropose) {
          onPropose(senderPostId, id);
        }
      }}
      className={`flex justify-between items-center px-4 py-3.5
      bg-white rounded-2xl border border-[#C5E4F8] transition-all
      ${isAlreadyRequested ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
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

      {isAlreadyRequested && (
        <span className="text-gray-400 text-light-13 shrink-0">제안 완료</span>
      )}
    </div>
  );
};
