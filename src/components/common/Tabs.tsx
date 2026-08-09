// 탭 하나하나의 데이터 형태
export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[]; // 탭 목록 배열
  activeTabId: string; // 현재 선택된 탭의 ID
  onTabChange: (id: string) => void; // 탭 클릭 시 실행될 함수
  variant?: 'line' | 'pill'; // line: 가로 꽉 차는 밑줄형, pill: 작고 둥근 버튼형
  className?: string;
}

export const Tabs = ({
  tabs,
  activeTabId,
  onTabChange,
  variant = 'line',
  className = '',
}: TabsProps) => {
  // 💡 1. 라인(Line) 타입 렌더링
  if (variant === 'line') {
    return (
      <div className={`flex w-full border-b border-gray-200 ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 py-3 text-center text-[15px] font-medium transition-colors duration-200
                border-b-2 
                ${
                  isActive
                    ? 'border-brand-lightBlue text-brand-lightBlue'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  // 💡 2. 알약(Pill) 타입 렌더링
  return (
    <div
      className={`inline-flex items-center bg-white border border-gray-200 rounded-full p-0.5 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200
              ${
                isActive
                  ? 'bg-brand-lightBlue text-white shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
