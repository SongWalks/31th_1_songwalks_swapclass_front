import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ICONS } from '@/constants/icons';
import { IconButton } from '@/components/common/IconButton';
import sooLogo from '@/assets/icons/soo-logo.png';
import axiosInstance from '@/api/axiosInstance'; // 💡 수정해둔 인터셉터 활용

export const HomeHeader = ({
  isScrolled = false,
}: {
  isScrolled?: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation(); // 💡 1. 현재 사용자 경로 추적

  // 💡 2. 부모에게서 prop으로 받지 않고, 헤더 자체에서 상태 관리
  const [unreadCount, setUnreadCount] = useState(0);
  const token = localStorage.getItem('soo_access_token');

  useEffect(() => {
    // 💡 토큰이 없으면 이미 초기값이 0이므로 상태 변경 없이 즉시 종료
    if (!token) {
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const response = await axiosInstance.get(
          '/api/notifications/unread-count',
        );
        const data = response.data?.data;

        if (data) {
          const totalCount = Object.values(data).reduce(
            (sum: number, current: unknown) => sum + (Number(current) || 0),
            0,
          );
          setUnreadCount(totalCount);
        }
      } catch (error) {
        console.error('알림 개수 조회 실패:', error);
      }
    };

    fetchUnreadCount();
  }, [token, location.pathname]);

  return (
    <header
      className={`sticky top-0 z-50 flex justify-between items-center w-full h-[56px] px-2 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center w-12 h-12 ml-2">
        <img
          src={sooLogo}
          alt="SOO Logo"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex items-center justify-end mr-1">
        {token && (
          <div
            className="relative mt-1 cursor-pointer"
            onClick={() => navigate('/alert')}
          >
            <IconButton icon={ICONS.BELL} />

            {unreadCount > 0 && (
              <div className="absolute top-2.5 left-1.5 w-1 h-1 bg-point-red rounded-full pointer-events-none" />
            )}
          </div>
        )}
      </div>
    </header>
  );
};
