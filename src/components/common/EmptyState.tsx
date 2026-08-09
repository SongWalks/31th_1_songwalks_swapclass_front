import React from 'react';
import { Icon } from '@iconify/react';
import { ICONS } from '@/constants/icons';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => {
  return (
    // 💡 py-20을 지우고, w-full, h-full, flex-1, min-h-[50vh]를 추가했습니다.
    <div
      className={`flex flex-col items-center justify-center w-full h-full flex-1 min-h-[50vh] px-6 text-center ${className}`}
    >
      <div className="mb-2 text-brand-lightBlue text-5xl">
        <Icon icon={ICONS.WARNING} />
      </div>

      <h3 className="text-medium-14 text-gray-900 mb-1">{title}</h3>

      {description && (
        <p className="text-light-13 text-gray-500 mb-6 whitespace-pre-wrap leading-relaxed">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  );
};
