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
