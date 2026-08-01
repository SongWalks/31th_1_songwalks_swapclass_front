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
  myDiscardCourse: Course;
  requestStatus: string;

  // 박스 클릭 시 호출될 함수 (부모에서 주입)
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

  // 백엔드 상태에 따라 분기 (상태명은 백엔드 확인 후 수정 필요)
  const isAlreadyRequested = requestStatus !== 'NONE';

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

      {/* 이미 요청한 경우 우측에 작은 텍스트로 피드백만 주기 (선택 사항 - 필요 없으면 삭제 가능) */}
      {isAlreadyRequested && (
        <span className="text-gray-400 text-light-13 shrink-0">제안 완료</span>
      )}
    </div>
  );
};
