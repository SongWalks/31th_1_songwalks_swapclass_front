import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { ICONS } from '@/constants/icons';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
}

export const Toast = ({
  message,
  isVisible,
  onClose,
  duration = 3000,
  icon = ICONS.CHECK,
  actionText,
  onAction,
}: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <div
      className={`
        fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[90%] 
        px-5 py-3 bg-gray-800 text-white text-sm font-medium rounded-full shadow-lg 
        flex items-center gap-2 
        transition-all duration-300 ease-in-out
        ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
    >
      <Icon icon={icon} className="text-[#3DA5F5] text-lg shrink-0" />
      <span className="flex-1 break-keep leading-snug">{message}</span>

      {/* 🚀 액션 버튼 렌더링 */}
      {actionText && onAction && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // 이벤트 전파 방지
            onAction();
          }}
          className="ml-3 text-[#3DA5F5] font-bold hover:underline shrink-0"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
