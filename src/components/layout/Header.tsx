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
    // :bulb: 높이를 60px(모바일 표준)로 기본 고정하되, height prop으로 오버라이드 가능. z-index를 높여 스크롤 시 위로 올라오게 합니다.
    <header
      style={{ height: `${height}px` }}
      className="relative flex justify-between items-center w-full px-4 bg-[#FBFBFB] border-b border-gray-200 z-50"
    >
      {/* 1. 왼쪽 영역 (뒤로가기 버튼 or 메인 로고) */}
      <div className="flex items-center z-10">{leftNode}</div>

      {/* 2. 타이틀 영역 (화면의 절대적인 정중앙에 고정) */}
      {title && (
        <div className="absolute inset-x-0 flex justify-center items-center pointer-events-none">
          {/* pointer-events-none을 뚫고 텍스트 클릭/드래그가 가능하도록 auto 복구 */}
          <span className="text-semibold-18 text-gray-900 pointer-events-auto">
            {title}
          </span>
        </div>
      )}

      {/* 3. 오른쪽 영역 (알림 종, 햄버거 메뉴 등 - gap-3으로 여러 아이콘 대응) */}
      <div className="flex items-center justify-end gap-3 z-10">
        {rightNode}
      </div>
    </header>
  );
}
