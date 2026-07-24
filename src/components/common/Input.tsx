import React, { forwardRef } from 'react';
import cautionIcon from '@/assets/icons/caution.svg';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string | React.ReactNode; // 💡 새로 추가된 라벨 타입
  leftNode?: React.ReactNode; // 왼쪽 아이콘 (이메일, 자물쇠 등)
  rightNode?: React.ReactNode; // 오른쪽 아이콘 (눈 모양, 전송 버튼 등)
  isError?: boolean; // 에러 여부 (빨간 테두리)
  errorMessage?: string; // 하단 빨간 에러 메시지
  variant?: 'default' | 'pill'; // default: 둥근 네모, pill: 채팅용 알약 모양
}

// 💡 react-hook-form 등 폼 라이브러리와 호환되도록 forwardRef 사용
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label, // 💡 추가된 부분
      leftNode,
      rightNode,
      isError = false,
      errorMessage,
      variant = 'default',
      className = '',
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full flex flex-col gap-1">
        {/* 💡 새로 추가된 라벨 영역 */}
        {label && (
          <label className="text-sm font-medium text-gray-900 mb-1">
            {label}
          </label>
        )}

        {/* 입력창 + 아이콘을 감싸는 컨테이너 */}
        <div className="relative flex items-center w-full">
          {/* 1. 왼쪽 아이콘 영역 */}
          {leftNode && (
            <div className="absolute left-4 flex items-center justify-center text-gray-400">
              {leftNode}
            </div>
          )}

          {/* 2. 실제 input 태그 */}
          <input
            ref={ref}
            className={`
              w-full text-sm text-gray-900 transition-colors duration-200
              placeholder:text-gray-400 focus:outline-none
              ${variant === 'default' ? 'py-3 rounded-md' : 'py-2.5 rounded-full'}
              ${leftNode ? 'pl-11' : 'pl-4'} 
              ${rightNode ? 'pr-11' : 'pr-4'}
              ${
                isError
                  ? 'border border-point-red focus:border-point-red bg-white'
                  : variant === 'pill'
                    ? 'bg-white border border-gray-300 focus:border-gray-400' // 💡 배경 흰색, 테두리 회색으로 변경
                    : 'bg-white border border-gray-300 focus:border-gray-700'
              }
              ${className}
            `}
            {...props}
          />

          {/* 3. 오른쪽 아이콘 영역 */}
          {rightNode && (
            <div className="absolute right-4 flex items-center justify-center text-gray-400">
              {rightNode}
            </div>
          )}
        </div>

        {/* 4. 에러 메시지 영역 */}
        {isError && errorMessage && (
          <span className="text-xs text-point-red flex items-center gap-1 mt-1 pl-1">
            <img src={cautionIcon} className="size-4" />
            {errorMessage}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
