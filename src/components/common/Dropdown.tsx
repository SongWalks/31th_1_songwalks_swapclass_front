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
  // 🚀 1. CourseSearchPage에서 넘겨주는 제어 속성 추가
  isOpen?: boolean;
  onToggle?: () => void;
}

export const Dropdown = ({
  options,
  value,
  onChange,
  placeholder = '선택',
  className = '',
  isOpen: externalIsOpen, // 🚀 2. 외부 isOpen 값
  onToggle, // 🚀 3. 외부 토글 함수
}: DropdownProps) => {
  // 내부 상태 (CourseSearchPage 외에 다른 곳에서 단독으로 쓰일 때를 대비)
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // 외부에서 isOpen을 제어하면 그걸 따르고, 아니면 내부 상태를 따릅니다.
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const selectedOption = options.find((opt) => opt.value === value);

  // 🚀 4. 토글 핸들러 수정
  const handleToggle = () => {
    if (onToggle) {
      onToggle(); // 외부 함수가 있으면 실행
    } else {
      setInternalIsOpen(!internalIsOpen); // 없으면 내부 상태 변경
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* 선택된 값 보여주는 버튼 */}
      <button
        type="button"
        onClick={handleToggle}
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
        // 🚀 5. z-index를 100으로 올리고, overflow-hidden 대신 max-h-60 overflow-y-auto를 추가해 잘림 방지
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                // 🚀 6. 단독 사용일 때만 닫히도록 처리
                if (externalIsOpen === undefined) {
                  setInternalIsOpen(false);
                }
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
