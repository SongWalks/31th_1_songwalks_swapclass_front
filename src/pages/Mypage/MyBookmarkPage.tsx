import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { PostCard, type Post } from '@/components/common/PostCard';
import {
  getMyLoungeBookmarks,
  type LoungePostItem,
} from '@/api/mypage/myloungeApi';
import { NotificationBell } from '@/components/common/NotificationBell';

// 💡 LoungePostItem 타입엔 아직 없지만 실제 응답엔 있는 content 필드를 위한 확장 타입
interface LoungePostWithContent extends LoungePostItem {
  content?: string;
}

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

  // 💡 ISO 날짜 포맷팅 (MM/DD HH:mm)
  // 💡 버그 수정: 서버가 createdAt 끝에 'Z'(UTC 표시)를 안 붙여서 줄 때가 있어서, 그럴 땐
  // 브라우저가 "이미 로컬 시간(한국시간)"으로 착각해 UTC 숫자를 그대로 찍어버렸음.
  // 'Z'가 없으면 붙여서 UTC로 인식시킨 뒤 변환함.
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(dateString);
    const normalized = hasTimezone ? dateString : `${dateString}`;
    const date = new Date(normalized);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  // 💡 API 응답(LoungePostItem)을 PostCard가 기대하는 Post 형태로 변환
  // 💡 PostCard의 postType은 '강의꿀팁'/'폐강과목' 문자열을 정확히 봐서 뱃지를 고름 (기존에
  // 쓰던 '폐강위기' 라벨과 다름 — PostCard 쪽 규칙에 맞춤)
  const toPostCardData = (post: LoungePostItem): Post => ({
    id: post.id,
    title: post.title,
    content: (post as LoungePostWithContent).content || '',
    date: formatDate(post.createdAt),
    postType: post.type === 'CLOSURE' ? '폐강과목' : '강의꿀팁',
    courseTag: post.courseName,
    likes: post.likeCount,
    comments: post.commentCount,
    // 💡 내 북마크 목록이므로 항상 true 고정 (원래 filled={true}였던 것과 동일)
  });

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
          title={<div>내 북마크 목록</div>}
          rightNode={<NotificationBell />}
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
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={toPostCardData(post)}
                onClick={() => navigate(`/post/${post.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookmarkPage;
