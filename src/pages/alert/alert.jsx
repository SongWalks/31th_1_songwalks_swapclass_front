import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { Toast } from '@/components/common/Toast';
import { ICONS } from '@/constants/icons';
import { apiFetch } from '@/api/auth/client';
import { getTokens } from '@/store/tokenStorage';

// 💡 알림 타입별 아이콘 - src/assets/icons 안의 실제 파일명으로 교체하세요.
import matchIcon from '@/assets/icons/matchoffer.svg';
import likeIcon from '@/assets/icons/dibs.svg';
import checkIcon from '@/assets/icons/matched.svg';
import clockIcon from '@/assets/icons/hands.svg';
import cancelIcon from '@/assets/icons/matched.svg';
import systemIcon from '@/assets/icons/dibs.svg';

// apiFetch가 API_BASE를 이미 붙이므로 여기는 path만 관리
const API = {
  UNREAD_COUNT: '/api/notifications/unread-count',
  LIST: '/api/notifications',
  READ_ONE: (id) => `/api/notifications/${id}/read`,
  READ_ALL: '/api/notifications/read-all',
};

const PAGE_SIZE = 20;

const USE_MOCK = false;

const TYPE_ICON_MAP = {
  MATCH_PROPOSAL: { icon: matchIcon, bg: 'bg-blue-100' },
  MATCH_REQUESTED: { icon: matchIcon, bg: 'bg-blue-100' },
  MATCH_ACCEPTED: { icon: checkIcon, bg: 'bg-blue-100' },
  MATCH_REJECTED: { icon: cancelIcon, bg: 'bg-gray-100' },
  MATCH_TIMEOUT: { icon: cancelIcon, bg: 'bg-gray-100' },
  EXCHANGE_SCHEDULED: { icon: clockIcon, bg: 'bg-blue-100' },
  VERIFY_30MIN: { icon: clockIcon, bg: 'bg-blue-100' },
  VERIFY_10MIN: { icon: clockIcon, bg: 'bg-blue-100' },
  VERIFY_5MIN: { icon: clockIcon, bg: 'bg-blue-100' },
  SWAP_RESULT: { icon: checkIcon, bg: 'bg-blue-100' },
  CANCEL: { icon: cancelIcon, bg: 'bg-gray-100' },
  LIKE: { icon: likeIcon, bg: 'bg-pink-50' },
  PENALTY: { icon: systemIcon, bg: 'bg-gray-100' },
  SYSTEM: { icon: systemIcon, bg: 'bg-gray-100' },
};

const TOAST_BY_TYPE = {
  EXPIRED_POST: '존재하지 않거나 삭제된 게시글입니다.',
  EXPIRED_MATCH: '만료된 매칭 제안입니다.',
  LOAD_FAILED: '알림을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
};

const formatRelativeTime = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${Math.floor(diffHour / 24)}일 전`;
};

export default function AlertPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  const pageRef = useRef(0);
  const listRef = useRef(null);

  useEffect(() => {
    fetchNotifications({ reset: true });
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setIsToastVisible(true);
  };

  // page: 알림 목록 조회 (page/size 파라미터로 페이지네이션)
  const fetchNotifications = async ({ reset = false } = {}) => {
    const page = reset ? 0 : pageRef.current;

    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const token = getTokens()?.accessToken;
      const payload = await apiFetch(
        `${API.LIST}?page=${page}&size=${PAGE_SIZE}`,
        { token },
      );
      const fetched = payload?.data?.notifications ?? [];
      setNotifications((prev) => (reset ? fetched : [...prev, ...fetched]));
      setHasMore(fetched.length === PAGE_SIZE);
      pageRef.current = page + 1;
    } catch {
      // apiFetch는 401/403/네트워크 오류 시 ApiError를 던짐 (여기서는 메시지 구분 없이 안내)
      showToast(TOAST_BY_TYPE.LOAD_FAILED);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // API 1. 안 읽은 알림 개수 조회
  // TODO: 헤더/탭바 뱃지 UI 나오면 마운트 시(or 폴링)로 연결
  // const fetchUnreadCount = async () => {
  //   try {
  //     const token = getTokens()?.accessToken;
  //     const payload = await apiFetch(API.UNREAD_COUNT, { token });
  //     return payload?.data?.unreadCount ?? null;
  //   } catch {
  //     return null;
  //   }
  // };

  // // API 5. 알림 전체 읽음 처리
  // // TODO: '모두 읽음' 버튼 UI 나오면 onClick에 연결하고 아래처럼 로컬 상태도 갱신
  // const markAllAsRead = async () => {
  //   try {
  //     const token = getTokens()?.accessToken;
  //     await apiFetch(API.READ_ALL, { method: 'PATCH', token });
  //     setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  //     return true;
  //   } catch {
  //     return false;
  //   }
  // };

  // 리스트를 끝까지 스크롤하면 다음 페이지 로드 (기존 "불러오는 중..." 표시를 그대로 재사용)
  const handleScroll = () => {
    if (USE_MOCK || isLoading || isLoadingMore || !hasMore) return;
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
    if (nearBottom) {
      fetchNotifications({ reset: false });
    }
  };

  const handleBack = () => navigate(-1);

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      if (USE_MOCK) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
      } else {
        try {
          const token = getTokens()?.accessToken;
          await apiFetch(API.READ_ONE(item.id), { method: 'PATCH', token });
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
          );
        } catch {
          // 읽음 처리 실패는 조용히 무시 (다음 진입 시 재시도됨)
        }
      }
    }

    if (!item.deepLink) return;

    // 3번 API(알림 목록 조회) 명세에 정의된 두 케이스만 만료/삭제로 취급한다.
    // 그 외 네트워크 오류 등은 "삭제됨"으로 단정할 근거가 없으므로 일단 이동시킨다.
    try {
      const res = await fetch(item.deepLink, { credentials: 'include' });
      if (res.status === 404) {
        showToast(TOAST_BY_TYPE.EXPIRED_POST);
        return;
      }
      if (res.status === 410) {
        showToast(TOAST_BY_TYPE.EXPIRED_MATCH);
        return;
      }
      navigate(item.deepLink);
    } catch {
      navigate(item.deepLink);
    }
  };

  return (
    <div className="relative bg-[#fbfbfb] mx-auto overflow-hidden font-['Pretendard'] h-full flex flex-col">
      <div className="sticky top-0 z-20 bg-[#fbfbfb]">
        <Header
          leftNode={<IconButton icon={ICONS.BACK} onClick={handleBack} />}
          title={'알림'}
        />
      </div>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex flex-col overflow-y-auto flex-1 min-h-0 bg-[#fbfbfb]"
      >
        {isLoading && (
          <div className="flex justify-center items-center py-10 text-gray-400 text-sm">
            불러오는 중...
          </div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="flex justify-center items-center py-20 text-gray-400 text-sm">
            새로운 알림이 없습니다.
          </div>
        )}

        {notifications.map((item) => {
          const { icon, bg } = TYPE_ICON_MAP[item.type] ?? TYPE_ICON_MAP.SYSTEM;
          const [mainLine, subLine] = item.body.split('\n');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNotificationClick(item)}
              className={`flex items-start gap-3 px-5 py-4 text-left border-b border-gray-100 transition-colors ${
                item.isRead ? 'bg-[#fbfbfb]' : 'bg-[#F1F7FB]'
              }`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${bg}`}
              >
                <img src={icon} alt="" className="w-5 h-5" />
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-brand-navy truncate">
                    {item.title}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
                <p className="text-sm mt-1" style={{ color: '#19191B' }}>
                  {mainLine}
                </p>
                {subLine && (
                  <p className="text-xs mt-0.5" style={{ color: '#61646B' }}>
                    {subLine}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {!isLoading && isLoadingMore && (
          <div className="flex justify-center items-center py-10 text-gray-400 text-sm">
            불러오는 중...
          </div>
        )}
      </div>

      <Toast
        message={toastMessage}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
        icon={ICONS.CLOSE}
      />
    </div>
  );
}
