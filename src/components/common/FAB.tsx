import { Icon } from '@iconify/react';
import { ICONS } from '@/constants/icons';

interface FABProps {
  onClick: () => void;
  text?: string;
  icon?: string;
  className?: string;
}

export const FAB = ({
  onClick,
  text,
  icon = ICONS.PLUS,
  className = '',
}: FABProps) => {
  const isPill = Boolean(text);

  return (
    <button
      onClick={onClick}
      className={`
        absolute bottom-28 right-8 z-40 
        flex items-center justify-center gap-1.5
        bg-brand-lightBlue text-white font-bold
        
        shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_8px_16px_rgba(0,0,0,0.15)]
        
        active:translate-y-1 active:shadow-[inset_0_0px_4px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.15)]
        
        transition-all duration-200 ease-out
        
        ${isPill ? 'px-5 py-3 rounded-full text-[15px]' : 'w-14 h-14 rounded-full text-2xl'}
        ${className}
      `}
    >
      <Icon icon={icon} className={isPill ? 'text-lg' : ''} />
      {text && <span>{text}</span>}
    </button>
  );
};
