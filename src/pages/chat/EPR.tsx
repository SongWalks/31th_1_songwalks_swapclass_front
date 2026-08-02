import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import clockIcon from '@/assets/icons/clock.svg';
import { NotificationBell } from '@/components/common/NotificationBell';

interface ExchangeRoom {
  id: number;
  myCourseName: string;
  counterpartCourseName: string;
  remainingMinutes: number | null; // null이면 '미정'
  isRead: boolean;
}

const MOCK_ROOMS: ExchangeRoom[] = [
  {
    id: 1,
    myCourseName: '마케팅과 소비자이슈',
    counterpartCourseName: '프로그래밍언어론',
    remainingMinutes: 30,
    isRead: false,
  },
  {
    id: 2,
    myCourseName: '자바프로그래밍',
    counterpartCourseName: '소비자 경제',
    remainingMinutes: null,
    isRead: false,
  },
];

const formatRemaining = (min: number | null) => {
  if (min === null) return '미정';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export default function ExchangeRoomListPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<ExchangeRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      // TODO: 채팅방 목록 조회 API 붙이기 (지금은 mock)
      await new Promise((r) => setTimeout(r, 200));
      setRooms(MOCK_ROOMS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 마운트 시 1회 데이터 페칭 - 의도된 패턴이라 룰 예외 처리
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchRooms();
  }, []);

  const handleRoomClick = (roomId: number) => navigate(`/chat/${roomId}`);

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
            onClick={() => handleRoomClick(room.id)}
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
    </div>
  );
}
