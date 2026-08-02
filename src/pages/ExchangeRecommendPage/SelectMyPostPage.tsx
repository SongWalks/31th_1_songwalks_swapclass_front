import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import { Icon } from '@iconify/react';
import axiosInstance from '@/api/axiosInstance';

interface CourseDetail {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
}

interface WantedCourseItem {
  priority: number;
  course: CourseDetail;
}

interface MyPostResponse {
  postId: number;
  status: 'MATCHABLE' | 'IN_EXCHANGE' | 'COMPLETED' | 'DELETED' | string;
  discardCourse: CourseDetail;
  wantedCourses: WantedCourseItem[];
}

interface MyPostListItem {
  id: number;
  title: string;
  preferredSubjects: string[];
  alreadyProposed: boolean;
}

const SelectMyPostPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();

  const [myPosts, setMyPosts] = useState<MyPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💡 상대방(받는 쪽) 게시글이 원하는 과목 목록 + 그중 내가 고른 과목의 순위
  const [targetWantedCourses, setTargetWantedCourses] = useState<
    WantedCourseItem[]
  >([]);
  const [matchedPriority, setMatchedPriority] = useState<number | null>(null);

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/posts/me');
        const raw: MyPostResponse[] = response.data?.data || [];
        const eligible = raw.filter((p) => p.status === 'MATCHABLE');

        const mapped: MyPostListItem[] = eligible.map((p) => {
          const sorted = [...(p.wantedCourses || [])].sort(
            (a, b) => a.priority - b.priority,
          );
          return {
            id: p.postId,
            title: p.discardCourse?.name ?? '',
            preferredSubjects: sorted.map((w) => w.course?.name ?? ''),
            alreadyProposed: false,
          };
        });

        setMyPosts(mapped);
      } catch (error) {
        console.error('내 게시글 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, []);

  useEffect(() => {
    if (!postId) return;

    const fetchTargetWantedCourses = async () => {
      try {
        const response = await axiosInstance.get(`/api/posts/${postId}`);
        setTargetWantedCourses(response.data?.data?.wantedCourses || []);
      } catch (error) {
        console.error('상대 게시글 조회 실패:', error);
      }
    };

    fetchTargetWantedCourses();
  }, [postId]);

  const handleSelectPost = async (
    myPostId: number,
    alreadyProposed: boolean,
  ) => {
    if (alreadyProposed || isSubmitting || !postId) return;

    setSelectedId(myPostId);

    // 💡 선택한 내 게시글(버릴 과목)이 상대방 희망 목록 몇 순위인지 찾기
    const post = myPosts.find((p) => p.id === myPostId);
    const matched = targetWantedCourses.find(
      (w) => w.course.name === post?.title,
    );
    setMatchedPriority(matched ? matched.priority : null);

    try {
      setIsSubmitting(true);
      const response = await axiosInstance.post('/api/proposals', {
        senderPostId: myPostId,
        receiverPostId: Number(postId),
      });

      if (response.data?.success) {
        setTimeout(() => {
          navigate(`/board/${postId}`, {
            replace: true,
            state: { justProposed: true },
          });
        }, 3000);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('제안 생성 실패:', error);
      const serverMessage = error?.response?.data?.message;
      alert(serverMessage || '제안을 보내는 중 오류가 발생했습니다.');
      setSelectedId(null);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-neutral-50 flex flex-col font-['Pretendard']">
      <div className="[&>header]:!border-none sticky top-0 z-40 bg-neutral-50">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={
            <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
              <span>내 게시글</span>
            </div>
          }
        />
      </div>

      <div className="flex items-start gap-2 bg-amber-50 -mx-2 px-4 py-3 mb-6">
        {selectedId ? (
          <>
            <Icon
              icon="mdi:check-circle-outline"
              className="w-6 h-4 text-yellow-700 mt-0.5 shrink-0"
            />
            <p className="text-yellow-700 text-sm font-medium leading-5 tracking-wide">
              {myPosts.find((p) => p.id === selectedId)?.title} 선택됨
              <br />
              {matchedPriority
                ? `상대방의 교환 희망 ${matchedPriority}순위 과목입니다`
                : '상대방의 희망 과목 목록에 없는 과목입니다'}
            </p>
          </>
        ) : (
          <>
            <Icon
              icon="mdi:alert-outline"
              className="w-6 h-4 text-amber-500 mt-0.5 shrink-0"
            />
            <p className="text-yellow-700 text-sm font-medium leading-5 tracking-wide">
              상대방의 1순위 과목을 교환 요청 시 매칭 성공률이 올라가요
            </p>
          </>
        )}
      </div>

      <div className="flex-1 px-4">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            불러오는 중입니다...
          </div>
        ) : myPosts.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            선택 가능한 게시글이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col px-4 gap-3 pb-28 divide-y">
            {myPosts.map((post) => {
              const isSelected = selectedId === post.id;
              return (
                <button
                  key={post.id}
                  onClick={() =>
                    handleSelectPost(post.id, post.alreadyProposed)
                  }
                  disabled={post.alreadyProposed || isSubmitting}
                  className={`w-full text-left py-6 px-3 -mx-3 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-[#F1F7FB] border border-brand-lightBlue'
                      : 'border border-transparent'
                  } ${
                    post.alreadyProposed ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-black leading-5 tracking-wide">
                      {post.title}
                    </h3>
                    {post.alreadyProposed && (
                      <span className="px-3 py-1 bg-zinc-300 rounded-2xl text-xs text-black shrink-0">
                        요청완료
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-1.5 relative">
                    {post.preferredSubjects.map((subject, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] text-black/60 font-light shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-xs font-light text-black/70 leading-5 tracking-wide">
                          {subject}
                        </span>
                      </div>
                    ))}

                    {!post.alreadyProposed && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="absolute -right-5 bottom-5 text-cyan-900"
                      >
                        <path
                          d="M8.59063 18.1598L14.2506 12.4998L8.59063 6.83984L7.89062 7.54984L12.8406 12.4998L7.89062 17.4498L8.59063 18.1598Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectMyPostPage;
