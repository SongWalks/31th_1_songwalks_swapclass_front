import React from 'react';

interface CourseCardProps {
  title: string | React.ReactNode;
  professor?: string;
  time?: string;
  badges?: React.ReactNode;
  leftNode?: React.ReactNode;
  rightNode?: React.ReactNode;
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

      {/* 2. 중앙 텍스트 및 배지 영역 (flex-1로 남는 공간 다 차지함) */}
      <div className="flex flex-col flex-1 gap-1.5">
        <h4 className="font-bold text-gray-900 text-[15px]">{title}</h4>

        {/* 교수, 시간 정보가 있을 때만 렌더링 (팀원 요청 스타일 반영됨) */}
        {(professor || time) && (
          <div className="text-neutral-500 text-sm font-light font-['Pretendard'] leading-5 whitespace-nowrap">
            {professor && <p>교수 : {professor}</p>}
            {time && <p>시간 : {time}</p>}
          </div>
        )}

        {/* 하단 배지 묶음 영역 */}
        {badges && <div className="flex flex-wrap gap-1.5 mt-1">{badges}</div>}
      </div>

      {/* 3. 우측 아이콘 영역 (X버튼 등) */}
      {rightNode && <div className="ml-3 shrink-0">{rightNode}</div>}
    </div>
  );
};
