import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { getMyLoungeBookmarks, type LoungePostItem } from '@/api/loungeApi';

// 카드 내 인라인 아이콘 컴포넌트들
const ClockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-zinc-400">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M8 4.5V8l2.5 1.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HeartIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-neutral-500">
    <path
      d="M8 13.5S1.75 9.86 1.75 5.75a3.25 3.25 0 0 1 6.25-1.32A3.25 3.25 0 0 1 14.25 5.75c0 4.11-6.25 7.75-6.25 7.75Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-neutral-500">
    <path
      d="M3.5 2.5h9v11l-4.5-3-4.5 3v-11Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
      fill={filled ? 'currentColor' : 'none'}
    />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-neutral-500">
    <path
      d="M2 3.5h12v7.5H6.5L3.5 13.5v-2.5H2v-7.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

const MyBookmarkPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<LoungePostItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 💡 API 데이터 불러오기
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await getMyLoungeBookmarks();
        if (response.success && response.data?.posts) {
          setPosts(response.data.posts);
        }
      } catch (error) {
        console.error('북마크 목록을 불러오지 못했습니다.', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  // 💡 API 타입('TIP' | 'CLOSURE')을 UI 태그 스타일로 변환
  const getCategoryTag = (type: string) => {
    if (type === 'CLOSURE') {
      return {
        label: '폐강위기',
        style: 'bg-yellow-100 text-zinc-900 border-yellow-500 border-[0.5px]',
      };
    }
    return {
      label: '강의꿀팁',
      style: 'bg-blue-400 text-white border-transparent',
    };
  };

  // 💡 ISO 날짜 포맷팅 (MM/DD HH:mm)
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col font-['Pretendard']">
      <div className="[&>header]:!border-none sticky top-0 z-50 bg-neutral-50">
        <Header
          leftNode={
            <IconButton
              icon={ICONS.BACK}
              onClick={() => navigate(-1)}
              className="text-black/40"
            />
          }
          title={
            <div className="text-left whitespace-nowrap transform -translate-x-16 text-black/70 text-xl font-semibold leading-5 tracking-wide">
              내 북마크 목록
            </div>
          }
          rightNode={
            <IconButton
              icon={ICONS.BELL}
              onClick={() => navigate('/notifications')}
              className="text-black/40"
            />
          }
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto bg-neutral-50">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
            목록을 불러오는 중입니다...
          </div>
        ) : posts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <EmptyState
              title="아직 북마크한 라운지 게시글이 없어요."
              className="!min-h-0"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-4 pt-4 pb-24">
            {posts.map((post) => {
              const categoryTag = getCategoryTag(post.type);

              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/lounge/${post.id}`)}
                  className="relative bg-white rounded-lg border border-zinc-400 p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between pr-6">
                    <h3 className="text-base font-bold text-zinc-900 leading-5 tracking-wide line-clamp-1">
                      {post.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ClockIcon />
                    <span className="text-xs font-normal text-neutral-500 leading-5 tracking-wide">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>

                  {/* 목록 API 응답에 content 필드가 포함된다면 아래 렌더링, 없다면 제목을 활용하거나 공란 처리 */}
                  {(post as any).content && (
                    <p className="text-xs font-light text-neutral-500 leading-5 tracking-wide mt-1 line-clamp-1">
                      {(post as any).content}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-6 px-2.5 flex items-center justify-center rounded-lg text-xs font-normal leading-5 tracking-wide border ${categoryTag.style}`}
                      >
                        {categoryTag.label}
                      </span>
                      <span className="h-6 px-2.5 flex items-center justify-center bg-gray-200 rounded-lg text-xs font-normal text-zinc-900 leading-5 tracking-wide">
                        {post.courseName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <HeartIcon />
                        <span className="text-xs font-normal text-neutral-500 leading-5 tracking-wide">
                          {post.likeCount}
                        </span>
                      </div>
                      {/* 내 북마크 목록이므로 true 고정, 만약 API가 bookmarked 상태를 준다면 post.bookmarked 사용 가능 */}
                      <BookmarkIcon filled={true} />
                      <div className="flex items-center gap-1">
                        <CommentIcon />
                        <span className="text-xs font-normal text-neutral-500 leading-5 tracking-wide">
                          {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookmarkPage;
