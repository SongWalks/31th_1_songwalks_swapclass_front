import React from 'react';

interface HeaderProps {
  leftNode?: React.ReactNode;
  title?: string | React.ReactNode;
  rightNode?: React.ReactNode;
  height?: number;
}

export default function Header({
  leftNode,
  title,
  rightNode,
  height = 80,
}: HeaderProps) {
  return (
<<<<<<< HEAD
    // 💡 높이를 56px(모바일 표준)로 고정하고, z-index를 높여 스크롤 시 위로 올라오게 합니다.
    <header className="relative flex justify-between items-center w-full h-[60px] px-4 bg-[#FBFBFB] border-b border-gray-200 z-50">
      {/* 1. 왼쪽 영역 (뒤로가기 버튼 or 메인 로고) */}
      <div className="flex items-center z-10">{leftNode}</div>

      {/* 2. 타이틀 영역 (화면의 절대적인 정중앙에 고정) */}
      {title && (
        <div className="absolute inset-x-0 flex justify-center items-center pointer-events-none">
          {/* pointer-events-none을 뚫고 텍스트 클릭/드래그가 가능하도록 auto 복구 */}
          <span className="text-semibold-18 text-gray-900 pointer-events-auto">
=======
    <header
      style={{ height: `${height}px` }}
      className="relative flex justify-between items-center w-full px-4 bg-[#FBFBFB] border-b border-gray-200 z-50"
    >
      {/* 1. 왼쪽 영역 (뒤로가기 버튼 + 타이틀 묶음) */}
      <div className="flex items-center gap-3 z-10">
        {leftNode}
        {title && (
          <span
            className={`text-semibold-18 text-gray-900 ${!leftNode ? 'ml-4' : ''}`}
          >
>>>>>>> da92837036da5417537f08086bbe249b0afac040
            {title}
          </span>
        )}
      </div>

      {/* 2. 오른쪽 영역 (알림 종, 햄버거 메뉴 등) */}
      <div className="flex items-center justify-end gap-3 z-10">
        {rightNode}
      </div>
    </header>
  );
}
