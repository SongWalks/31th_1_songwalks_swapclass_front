import { Icon } from '@iconify/react';
import { ICONS } from '@/constants/icons';

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  hasClose?: boolean;
  onClick?: () => void;
  onClose?: () => void;
}

export const FilterChip = ({
  label,
  isActive,
  hasClose,
  onClick,
  onClose,
}: FilterChipProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[14px] whitespace-nowrap transition-colors
        ${
          isActive
            ? 'bg-brand-lightBlue text-white border border-brand-lightBlue'
            : 'bg-[#F3F7FC] text-brand-lightBlue border border-brand-lightBlue'
        }
      `}
    >
      {label}
      {hasClose && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          className="ml-0.5 p-0.5 -mr-1 rounded-full hover:bg-white/20"
        >
          <Icon icon={ICONS.CLOSE} className="text-[12px]" />
        </span>
      )}
    </button>
  );
};
