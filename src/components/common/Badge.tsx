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
    | 'outlineBlue'
    | 'lightRed'
    | 'grayOutline'
    | 'bluesolid'
    | 'lightBlueOutline';
  className?: string;
}

const badgeVariants = {
  primary: 'bg-brand-lightBlue text-white',
  secondary: 'bg-gray-100 text-gray-700',
  lightBlue: 'bg-brand-soft text-brand-blue border border-[#BFDBFE]',
  lightPink: 'bg-point-pink text-[#BE185D] border border-[#FBCFE8]',
  lightYellow: 'bg-yellow-main text-[#CA8A04] border border-[#FEF08A]',
  outlineBlue: 'bg-white border border-brand-lightBlue text-brand-lightBlue',
  outlineGray: 'bg-white border border-gray-300 text-gray-600',
  lightRed: 'bg-red-100 text-red-100 border text-gray-600',
  grayOutline: 'bg-gray-200 text-zinc-900 border border-slate-400',
  bluesolid: 'bg-brand-lightBlue text-white border border-slate-500',
  lightBlueOutline: 'bg-blue-100 text-zinc-900 border border-brand-lightBlue',
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
