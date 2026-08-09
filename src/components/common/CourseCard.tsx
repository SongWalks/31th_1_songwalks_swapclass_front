import React from 'react';

interface CourseCardProps {
  title: string | React.ReactNode;
  professor?: string;
  time?: string;
  badges?: React.ReactNode;
  leftNode?: React.ReactNode;
  rightNode?: React.ReactNode;
  bottomRightNode?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const CourseCard = ({
  title,
  professor,
  time,
  badges,
  leftNode,
  rightNode,
  bottomRightNode,
  className = '',
  onClick,
}: CourseCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-start p-4 bg-white rounded-xl border border-gray-200 ${
        onClick ? 'cursor-pointer hover:bg-gray-50' : ''
      } ${className}`}
    >
      {/* 1. 좌측 아이콘 영역 (+버튼, 1순위 등) */}
      {leftNode && <div className="mr-3 mt-0.5 shrink-0">{leftNode}</div>}

      {/* 2. 중앙 및 우측 전체를 감싸는 래퍼 (flex-col로 상/하단 분리) */}
      <div className="flex flex-col flex-1 min-w-0 w-full">
        {/* --- [상단 영역]: 타이틀, 내용 + 우측 노드(시간) --- */}
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-[15px]">{title}</h4>

            {(professor || time) && (
              <div className="text-neutral-500 text-sm font-light font-['Pretendard'] leading-5 whitespace-nowrap">
                {professor}
                {professor && time && ' · '}
                {time}
              </div>
            )}
          </div>

          {/* 우측 상단 (시간 등) */}
          {rightNode && <div className="ml-3 shrink-0">{rightNode}</div>}
        </div>

        {/* --- [하단 영역]: 배지 + 우측 하단 노드(하트, 댓글 등) --- */}
        {(badges || bottomRightNode) && (
          <div className="flex items-center justify-between w-full mt-3">
            {/* 좌측 하단 (배지) */}
            <div className="flex flex-wrap gap-1.5 flex-1">{badges}</div>

            {/* ✅ 우측 하단 (액션 아이콘) - 카드의 맨 우측 끝으로 밀려납니다 */}
            {bottomRightNode && (
              <div className="shrink-0 ml-2">{bottomRightNode}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
