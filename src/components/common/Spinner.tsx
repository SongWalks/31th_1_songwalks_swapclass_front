interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  // Tailwind 너비(w), 높이(h), 테두리 굵기(border) 조합
  const sizeStyles = {
    sm: 'w-6 h-6 border-2', // 24px (버튼 안이나 좁은 영역)
    md: 'w-9 h-9 border-4', // 36px (기본)
    lg: 'w-16 h-16 border-4', // 64px (전체 화면 중앙)
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`
          ${sizeStyles[size]}
          border-brand-lightBlue
          border-t-transparent
          rounded-full
          animate-spin
        `}
      />
    </div>
  );
};
