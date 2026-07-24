import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean; // 모달 열림/닫힘 상태
  onClose?: () => void; // 배경 클릭 시 닫기 함수
  icon?: React.ReactNode; // 상단 아이콘 (경고, 에러 등)
  title?: string | React.ReactNode; // 모달 제목
  children?: React.ReactNode; // 모달 내용 (텍스트 또는 HTML)
  footer?: React.ReactNode; // 하단 버튼 영역
}

export const Modal = ({
  isOpen,
  onClose,
  icon,
  title,
  children,
  footer,
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // 전체 화면을 덮는 래퍼 (RootLayout 영역에 딱 맞춰집니다)
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      {/* 1. 어두운 반투명 배경 (클릭 시 onClose 실행) */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* 2. 하얀색 모달 박스 */}
      <div className="relative w-full bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* 상단 아이콘 */}
        {icon && <div className="mb-3">{icon}</div>}

        {/* 타이틀 */}
        {title && (
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        )}

        {/* 메인 내용 (whitespace-pre-wrap으로 \n 줄바꿈 자동 적용) */}
        {children && (
          <div className="text-sm text-gray-600 mb-6 leading-relaxed whitespace-pre-wrap w-full">
            {children}
          </div>
        )}

        {/* 하단 버튼 영역 */}
        {footer && (
          <div className="w-full flex justify-center gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
};
