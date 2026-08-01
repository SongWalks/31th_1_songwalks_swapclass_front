import { useState } from 'react';
import { Icon } from '@iconify/react';

interface Option {
  value: string;
  label: string;
}

interface DropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Dropdown = ({
  options,
  value,
  onChange,
  placeholder = '선택',
  className = '',
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative w-full ${className}`}>
      {/* 선택된 값 보여주는 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-brand-lightBlue transition-colors"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <Icon
          icon="ph:caret-down"
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 펼쳐지는 리스트 */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
