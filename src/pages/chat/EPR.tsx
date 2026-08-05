import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import clockIcon from '@/assets/icons/clock.svg';
import { NotificationBell } from '@/components/common/NotificationBell';
import { chatRoomApi } from '@/api/chat/chatRoomApi';
import { ApiError } from '@/api/chat/apiClient';

interface ExchangeRoom {
  id: number;
  myCourseName: string;
  counterpartCourseName: string;
  timerExpiresAt: string | null;
  lastMessageAt: string | null; // 메시지 존재 여부로 무응답 타임아웃 무효화 판단용
  remainingMinutes: number | null;
  isRead: boolean;
}

// 메시지가 한 번도 없었고(lastMessageAt === null), 타이머까지 지난 경우에만 '무응답 만료'로 판단
const isExpired = (
  timerExpiresAt: string | null,
  lastMessageAt: string | null,
) => {
  if (!timerExpiresAt) return false;
  if (lastMessageAt) return false; // 메시지가 오갔다면 무응답 타임아웃 자체가 무효
  return new Date(timerExpiresAt).getTime() <= Date.now();
};

const formatRemaining = (min: number | null) => {
  if (min === null) return '미정';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const calcRemainingMinutes = (timerExpiresAt: string | null): number | null => {
  if (!timerExpiresAt) return null;
  const remainMs = new Date(timerExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(remainMs / 60000));
};

export default function ExchangeRoomListPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ExchangeRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        const data = await chatRoomApi.getRoomList();
        const mapped: ExchangeRoom[] = data
          .map((room) => ({
            id: room.roomId,
            myCourseName: room.myCourseName,
            counterpartCourseName: room.partnerCourseName,
            timerExpiresAt: room.timerExpiresAt,
            lastMessageAt: room.lastMessageAt,
            remainingMinutes: calcRemainingMinutes(room.timerExpiresAt),
            isRead: false,
          }))
          .filter(
            (room) => !isExpired(room.timerExpiresAt, room.lastMessageAt),
          );

        if (!ignore) setRooms(mapped);
      } catch (err) {
        if (!ignore) {
          setApiError(
            err instanceof ApiError
              ? err.message
              : '채팅방 목록을 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    void fetchRooms();

    return () => {
      ignore = true;
    };
  }, []);

  // 30초마다 만료된 방을 목록에서 제거 + 남은시간 갱신
  useEffect(() => {
    const timer = setInterval(() => {
      setRooms((prev) =>
        prev
          .filter((room) => !isExpired(room.timerExpiresAt, room.lastMessageAt))
          .map((room) => ({
            ...room,
            remainingMinutes: calcRemainingMinutes(room.timerExpiresAt),
          })),
      );
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  const handleRoomClick = (room: ExchangeRoom) =>
    navigate(`/chat/${room.id}`, {
      state: {
        myCourseName: room.myCourseName,
        counterpartCourseName: room.counterpartCourseName,
      },
    });

  return (
    <div className="relative bg-[#fbfbfb] mx-auto overflow-hidden font-['Pretendard'] h-full flex flex-col">
      <div>
        <Header title="교환준비방" rightNode={<NotificationBell />} />
      </div>

      <div className="flex flex-col overflow-y-auto flex-1 min-h-0">
        {isLoading && (
          <div className="flex justify-center items-center py-10 text-gray-400 text-sm">
            불러오는 중...
          </div>
        )}
        {!isLoading && rooms.length === 0 && (
          <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
            교환 준비방이 없습니다.
          </div>
        )}

        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => handleRoomClick(room)}
            className="flex items-center justify-between gap-3 px-5 py-5 text-left border-b border-gray-300"
          >
            <div className="flex items-start gap-4 min-w-0">
              {!room.isRead && (
                <span className="w-2 h-2 rounded-full bg-brand-lightBlue flex-shrink-0 mt-1.5" />
              )}
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">
                  {room.myCourseName}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  ↔ {room.counterpartCourseName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 text-sm text-black">
              {<img src={clockIcon} alt="" className="w-3.5 h-3.5" />}
              <span>{formatRemaining(room.remainingMinutes)}</span>
            </div>
          </button>
        ))}
      </div>

      {apiError && (
        <div className="px-5 py-3 text-xs text-point-red text-center">
          {apiError}
        </div>
      )}
    </div>
  );
}
