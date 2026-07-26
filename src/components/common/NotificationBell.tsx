import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '@/constants/icons';
import { IconButton } from '@/components/common/IconButton';

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('accessToken');
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

        // 💡 백엔드 응답(result.success)이 성공이고, data 객체가 존재할 때
        if (result.success && result.data) {
          // result.data가 { "typeA": 1, "typeB": 2 } 형태이므로,
          // Object.values로 숫자 배열([1, 2])만 뽑아낸 뒤 모두 더해줍니다.
          const totalCount = Object.values(result.data).reduce(
            (sum: number, current: any) => sum + (Number(current) || 0),
            0,
          );

          setUnreadCount(totalCount);
        }
      } catch (error) {
        console.error('알림 개수 조회 실패:', error);
      }
    };

    fetchUnreadCount();
  }, []);

  return (
    <div
      className="relative cursor-pointer mt-1"
      onClick={() => navigate('/alert')}
    >
      <IconButton icon={ICONS.BELL} />

      {unreadCount > 0 && (
        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 bg-point-red rounded-full" />
      )}
    </div>
  );
};
