import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'warning' | 'light'; // 💡 2개 추가
  size?: 'lg' | 'md' | 'sm'; // 이름 직관적으로 변경 (full -> lg)
  fullWidth?: boolean; // 💡 너비를 100%로 할지 말지 결정하는 스위치
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string; // 💡 여백(mt-4 등)이나 비율(flex-1)을 밖에서 줄 수 있게 구멍 뚫기
}

const variantStyles = {
  primary: 'bg-brand-lightBlue text-white', // 기본 파란색 (시안의 진한 파란색 헥스코드에 맞춰주세요)
  danger: 'bg-point-red text-white', // 빨간색 (삭제, 실패)
  warning: 'bg-[#F98E15] text-white', // 💡 주황색 추가 (수락) - 시안 색상에 맞게 수정 필요
  light: 'bg-[#C5E4F8] text-brand-blue', // 💡 연파랑 추가 (교환채팅방 입장)
  outline: 'bg-white text-gray-700 border border-gray-300', // 테두리 (취소, 거절)
  ghost: 'bg-transparent text-gray-700',
};

// 💡 width를 빼고 padding과 글씨 크기만 남김
const sizeStyles = {
  lg: 'py-[15px] text-base rounded-xl',
  md: 'py-[10px] px-4 text-sm rounded-xl',
  sm: 'py-[2px] px-4 text-xs rounded-lg', // 알약 모양 제거, 네모 반듯하게
};

export default function Button({
  children,
  variant = 'primary',
  size = 'lg',
  fullWidth = true, // 기본적으로 화면을 꽉 채우도록 세팅
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        font-semibold transition-all duration-200 flex justify-center items-center
        whitespace-nowrap
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : 'w-auto'} 
        ${
          disabled
            ? 'bg-gray-500 text-white border-transparent cursor-not-allowed'
            : `${variantStyles[variant]} active:opacity-80`
        }
        ${className} 
      `}
    >
      {children}
    </button>
  );
}
