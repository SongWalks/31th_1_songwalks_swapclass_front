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

        // ✨ 핵심 수정 포인트: 정상 응답이 아닐 때의 방어 로직 추가
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // 토큰이 만료되었거나 유효하지 않으므로 로컬 스토리지에서 삭제
            localStorage.removeItem('soo_access_token');
          }
          return; // 에러 응답이므로 아래의 .json() 파싱을 건너뛰고 함수 종료
        }

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
