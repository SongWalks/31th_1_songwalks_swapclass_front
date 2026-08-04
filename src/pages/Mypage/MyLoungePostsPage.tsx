import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { PostCard, type Post } from '@/components/common/PostCard';
import {
  getMyLoungePosts,
  type LoungePostItem,
} from '@/api/mypage/myloungeApi';
import { NotificationBell } from '@/components/common/NotificationBell';

// 💡 LoungePostItem 타입엔 아직 없지만 실제 응답엔 있는 content 필드를 위한 확장 타입
interface LoungePostWithContent extends LoungePostItem {
  content?: string;
}

const MyLoungePostsPage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<LoungePostItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 💡 API 데이터 불러오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getMyLoungePosts();
        if (response.success && response.data?.posts) {
          setPosts(response.data.posts);
        }
      } catch (error) {
        console.error('내 라운지 게시글 목록을 불러오지 못했습니다.', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

  const toPostCardData = (post: LoungePostItem): Post => ({
    id: post.id,
    title: post.title,
    content: (post as LoungePostWithContent).content || '',
    date: formatDate(post.createdAt),
    postType: post.type === 'CLOSURE' ? '폐강과목' : '강의꿀팁',
    courseTag: post.courseName,
    likes: post.likeCount,
    comments: post.commentCount,
  });

  return (
    // 💡 relative: FAB(absolute)가 이 페이지 기준으로 위치를 잡도록 하는 기준점
    <div className="relative w-full h-full min-h-0 flex flex-col font-['Pretendard']">
      <div className="sticky top-0 z-50 bg-neutral-50 [&>header]:!border-none">
        <Header
          leftNode={
            <IconButton
              icon={ICONS.BACK}
              onClick={() => navigate(-1)}
              className="text-black/40"
            />
          }
          title={<div>내 라운지 게시글</div>}
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
              title="아직 등록한 라운지 게시글이 없어요."
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

export default MyLoungePostsPage;
