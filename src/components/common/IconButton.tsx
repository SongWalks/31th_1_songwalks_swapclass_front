import { Icon } from '@iconify/react';

interface IconButtonProps {
  icon: string;
  onClick?: () => void;
  className?: string; // 예외적으로 색상을 바꿔야 할 때만 (예: text-point-red)
  variant?: 'default' | 'ghost';
}

export const IconButton = ({
  icon,
  onClick,
  className = '',
  variant = 'default',
}: IconButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        p-2 rounded-full transition-colors duration-200 
        flex items-center justify-center
        ${
          variant === 'default'
            ? 'hover:bg-gray-100 active:bg-gray-200' // default: 기존처럼 마우스 올리면 회색 배경
            : 'hover:bg-transparent active:bg-transparent' // ghost: 마우스를 올려도 배경색 없이 투명함
        }
        ${className}
      `}
    >
      {/* 💡 아이콘 크기는 무조건 24px(text-2xl) 또는 20px(text-xl)로 고정 */}
      <Icon icon={icon} className="text-[22px] text-gray-800" />
    </button>
  );
};
