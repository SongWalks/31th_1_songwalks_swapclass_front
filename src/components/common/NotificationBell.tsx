import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '@/constants/icons';
import { IconButton } from '@/components/common/IconButton';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 컴포넌트가 그려질 때 토큰이 있는지 확인
  const token = localStorage.getItem('soo_access_token');

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!token) return;

      try {
        const response = await fetch(
          'https://swapclass.duckdns.org/api/notifications/unread-count',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (result.success && result.data) {
          const totalCount = Object.values(result.data).reduce(
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
  }, [token]);

  // 토큰이 없다면? UI를 아예 그리지 않고(null 반환) 컴포넌트 종료!
  if (!token) return null;

  return (
    <div className="relative inline-flex">
      <IconButton icon={ICONS.BELL} onClick={() => navigate('/alert')} />
      {unreadCount > 0 && (
        <div className="absolute top-2.5 left-1.5 w-1 h-1 bg-point-red rounded-full pointer-events-none" />
      )}
    </div>
  );
};
