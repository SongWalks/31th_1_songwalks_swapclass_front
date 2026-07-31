import { Icon } from '@iconify/react';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';

// ✅ 백엔드 데이터 매핑 후 최종적으로 PostCard가 받을 데이터 타입
export interface Post {
  id: string | number;
  title: string;
  content: string;
  date: string;
  postType?: '강의꿀팁' | '폐강과목' | string; // 뱃지 타입을 명시적으로 지정
  courseTag?: string; // 백엔드의 courseName
  likes: number; // 백엔드의 likeCount
  comments: number; // 백엔드의 commentCount
}

interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

export const PostCard = ({ post, onClick }: PostCardProps) => {
  return (
    <CourseCard
      onClick={onClick}
      className="shadow-sm cursor-pointer transition-transform active:scale-[0.98]"
      title={
        <div className="flex flex-col gap-1">
          <span className="font-bold text-gray-900 text-[16px]">
            {post.title}
          </span>
          {/* content가 있을 때만 렌더링되도록 방어 코드 추가 */}
          {post.content && (
            <span className="font-normal text-[14px] text-gray-500 line-clamp-2">
              {post.content}
            </span>
          )}
        </div>
      }
      rightNode={
        <div className="flex items-center gap-1 text-[12px] whitespace-nowrap text-gray-400 mt-1">
          <Icon icon="ph:clock-fill" className="text-[14px]" />
          <span>{post.date}</span>
        </div>
      }
      badges={
        <>
          {post.postType === '강의꿀팁' && (
            <Badge variant="primary">강의꿀팁</Badge>
          )}
          {post.postType === '폐강과목' && (
            <Badge variant="lightYellow">폐강과목</Badge>
          )}
          {post.courseTag && (
            <Badge variant="secondary">{post.courseTag}</Badge>
          )}
        </>
      }
      bottomRightNode={
        <div className="flex items-center gap-2.5 text-gray-400 text-[12px]">
          <div className="flex items-center gap-0.5">
            <Icon icon="ph:heart" className="text-[16px]" />
            <span>{post.likes}</span>
          </div>
          <Icon icon="ph:bookmark-simple" className="text-[16px]" />
          <div className="flex items-center gap-0.5">
            <Icon icon="ph:chat-circle" className="text-[16px]" />
            <span>{post.comments}</span>
          </div>
        </div>
      }
    />
  );
};
