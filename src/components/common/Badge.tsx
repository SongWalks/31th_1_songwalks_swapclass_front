import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'lightBlue'
    | 'lightPink'
    | 'lightYellow'
    | 'outlineGray'
    | 'outlineBlue';
  className?: string; // 추가적인 여백(ml-2) 등을 줄 때 사용
}

const badgeVariants = {
  primary: 'bg-brand-lightBlue text-white', // 파란 바탕 + 흰 글씨 (제안, 강의꿀팁)
  secondary: 'bg-gray-100 text-gray-700', // 회색 바탕 + 진회색 글씨 (데이터베이스)
  lightBlue: 'bg-brand-soft text-brand-blue border border-[#BFDBFE]', // 연파랑 바탕 + 파란 글씨 (전공필수)
  lightPink: 'bg-point-pink text-[#BE185D] border border-[#FBCFE8]', // 연분홍 바탕 + 붉은 글씨 (교양필수)
  lightYellow: 'bg-yellow-main text-[#CA8A04] border border-[#FEF08A]', // 연노랑 바탕 + 노랑 글씨 (교양필수)
  outlineBlue: 'bg-white border border-brand-lightBlue text-brand-lightBlue', // 흰 바탕 + 파란 테두리 + 파란 글씨 (요청받은 게시글)
  outlineGray: 'bg-white border border-gray-300 text-gray-600', // 흰 바탕 + 회색 테두리
  lightRed: 'bg-red-100 text-red-100 border text-gray-600',
  grayOutline: 'bg-gray-200 text-zinc-900 text-xs border border-slate-400 ', // 교양필수
  blueSolid:
    'bg-brand-lightBlue text-white text-xs font-light border border-slate-500 font-normal', // 졸업요건
  lightBlueOutline:
    'bg-blue-100 text-zinc-900 border text-xs border-brand-lightBlue ', //전공필수
};

export const Badge = ({
  children,
  variant = 'primary',
  className = '',
}: BadgeProps) => {
  return (
    <span
      className={`
        inline-flex items-center justify-center 
        px-2.5 py-1.5 text-[11px] font-semibold rounded-md 
        whitespace-nowrap leading-none tracking-wide
        ${badgeVariants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};
