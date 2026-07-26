import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
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
  // 💡 TODO: "이 게시글로 이 상대 게시글에 이미 제안했는지" 확인할 API가 아직 없어서 항상 false로 둠
  alreadyProposed: boolean;
}

// 💡 화면 확인용 목업 데이터 (와이어프레임 예시와 동일하게 5개, "공예CAD1"만 요청완료로 표시)
const MOCK_MY_POSTS: MyPostListItem[] = [
  {
    id: 1,
    title: '영어 회화',
    preferredSubjects: ['컴퓨터 구조', '컴퓨터 구조', '컴퓨터 구조'],
    alreadyProposed: false,
  },
  {
    id: 2,
    title: '교양필라테스',
    preferredSubjects: [
      '교양 요가',
      '발레를 통한 자세교정',
      '교양 웨이트 트레이닝',
    ],
    alreadyProposed: false,
  },
  {
    id: 3,
    title: 'SM리더특강',
    preferredSubjects: ['운영체제', '소프트웨어이해', '프로그래밍언어론'],
    alreadyProposed: false,
  },
  {
    id: 4,
    title: '공예CAD1',
    preferredSubjects: ['디지털스튜디오', '기초 id스튜디오', '트렌드디자인'],
    alreadyProposed: true,
  },
  {
    id: 5,
    title: 'SM리더특강',
    preferredSubjects: ['운영체제', '소프트웨어이해', '프로그래밍언어론'],
    alreadyProposed: false,
  },
];

const SelectMyPostPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>(); // 상대방(받는 쪽) 게시글 id

  const [myPosts, setMyPosts] = useState<MyPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMyPosts = async () => {
      // 🧪 임시: 화면 확인용 목업 데이터로 렌더링 (확인 끝나면 아래 return 지우고 실제 API 살리기)
      setLoading(true);
      setMyPosts(MOCK_MY_POSTS);
      setLoading(false);
      return;

      /* 💡 실제 API 연동 코드
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/posts/me');
        const raw: MyPostResponse[] = response.data?.data || [];
        // 교환 가능(MATCHABLE) 상태인 내 게시글만 선택 대상으로
        const eligible = raw.filter((p) => p.status === 'MATCHABLE');

        const mapped: MyPostListItem[] = eligible.map((p) => {
          const sorted = [...(p.wantedCourses || [])].sort(
            (a, b) => a.priority - b.priority,
          );
          return {
            id: p.postId,
            title: p.discardCourse?.name ?? '',
            preferredSubjects: sorted.map((w) => w.course?.name ?? ''),
            alreadyProposed: false, // TODO: 실제 여부 확인되면 반영
          };
        });

        setMyPosts(mapped);
      } catch (error) {
        console.error('내 게시글 조회 실패:', error);
      } finally {
        setLoading(false);
      }
      */
    };

    fetchMyPosts();
  }, []);

  const handleSelectPost = async (
    myPostId: number,
    alreadyProposed: boolean,
  ) => {
    if (alreadyProposed || isSubmitting) return;

    // 💡 선택 하이라이트는 postId(상대 게시글) 유무와 무관하게 항상 즉시 표시
    setSelectedId(myPostId);

    if (!postId) {
      // 🧪 테스트 모드: 실제 postId가 없을 때도 전체 흐름(선택→전송→상세페이지→완료모달)을
      // 끝까지 확인할 수 있도록, 성공한 것처럼 목업 상세페이지로 이동
      console.warn(
        'postId(상대 게시글)가 없어 실제 API 대신 테스트용 이동을 실행합니다.',
      );
      navigate('/test-specific-post', {
        replace: true,
        state: { justProposed: true },
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axiosInstance.post('/api/proposals', {
        senderPostId: myPostId,
        receiverPostId: Number(postId),
      });

      if (response.data?.success) {
        // 원래 게시글 상세로 돌아가면서, 그 화면에서 완료 모달을 띄우도록 상태 전달
        navigate(`/board/${postId}`, {
          replace: true,
          state: { justProposed: true },
        });
      }
    } catch (error) {
      console.error('제안 생성 실패:', error);
      alert('제안을 보내는 중 오류가 발생했습니다.');
      setSelectedId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-neutral-50 flex flex-col font-['Pretendard']">
      <div className="sticky top-0 z-40 bg-neutral-50">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={
            <div className="text-black/70 text-xl font-semibold leading-5 tracking-wide">
              내 게시글
            </div>
          }
        />
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
          <div className="flex flex-col divide-y">
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
                      ? 'bg-slate-100 border border-brand-lightBlue'
                      : 'border border-transparent'
                  } ${
                    post.alreadyProposed
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-black/[0.02]'
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
                        className="absolute right-2 bottom-5 text-cyan-900"
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
