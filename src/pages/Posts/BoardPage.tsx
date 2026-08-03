import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { NotificationBell } from '@/components/common/NotificationBell';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { EmptyState } from '@/components/common/EmptyState';
import { FAB } from '@/components/common/FAB';
import { Modal } from '@/components/common/Modal';
import { Dropdown } from '@/components/common/Dropdown';
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

// 💡 GET /api/posts 응답의 content 배열 항목
interface BoardPostResponse {
  postId: number;
  discardCourse: CourseDetail;
  wantedCourses: WantedCourseItem[];
  proposalCount: number;
  createdAt: string;
}

// 💡 GET /api/posts/me 응답 항목
interface MyPostResponse {
  postId: number;
  status: 'MATCHABLE' | 'IN_EXCHANGE' | 'COMPLETED' | 'DELETED' | string;
  discardCourse: CourseDetail;
  wantedCourses: WantedCourseItem[];
  createdAt: string;
}

interface BoardPost {
  id: number;
  title: string;
  preferredSubjects: string[];
  proposalCount: number;
  alreadyProposed: boolean;
}

const BoardPage = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(''); // 💡 GET /api/posts의 dept 파라미터로 사용됨 (자유 검색어 아님)
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  // 💡 "진짜로 게시글이 0개"인지 "API 호출 자체가 실패한 건지" 구분하기 위한 에러 상태
  const [loadError, setLoadError] = useState<string | null>(null);

  // 💡 내 게시글 정보: /api/posts/me로 조회
  const [myPostId, setMyPostId] = useState<number | null>(null); // 제안 보낼 때 senderPostId로 사용

  // 💡 비로그인 상태에서 스크롤 시 로그인/가입 유도 모달
  const [showLoginModal, setShowLoginModal] = useState(false);
  const hasShownLoginModal = useRef(false);

  // 💡 게시글 미등록 상태에서 메뉴(필터) 버튼 클릭 시 안내 모달
  const [showFilterModal, setShowFilterModal] = useState(false);

  // 💡 맞춤 필터: 드롭다운으로 특정 과목 하나를 골라서 필터링 (둘 중 하나만 선택 가능 — 고르면 반대쪽은 '전체'로 리셋)
  const [targetCourseFilter, setTargetCourseFilter] = useState('ALL');
  const [discardCourseFilter, setDiscardCourseFilter] = useState('ALL');

  // 💡 드롭다운에 뿌릴 옵션: 내가 올린 모든 게시글에서 모은 과목명들 (중복 제거)
  const [myTargetOptions, setMyTargetOptions] = useState([
    { value: 'ALL', label: '내 타겟 과목' },
  ]);
  const [myDiscardOptions, setMyDiscardOptions] = useState([
    { value: 'ALL', label: '내 버릴 과목' },
  ]);

  // 1. 내 게시글 목록 조회 (senderPostId 확보 + 드롭다운 옵션 채우기)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const fetchMyPosts = async () => {
      try {
        const response = await axiosInstance.get('/api/posts/me', {
          params: { status: 'MATCHABLE' },
        });
        const myPosts: MyPostResponse[] = response.data?.data || [];

        // 제안을 보낼 때 쓸 postId: 교환 가능(MATCHABLE) 상태인 첫 게시글 기준
        const activePost = myPosts.find((p) => p.status === 'MATCHABLE');
        setMyPostId(activePost ? activePost.postId : null);

        const wantedNames = new Set<string>();
        const discardNames = new Set<string>();
        myPosts.forEach((p) => {
          if (p.discardCourse?.name) discardNames.add(p.discardCourse.name);
          (p.wantedCourses || []).forEach((w) => {
            if (w.course?.name) wantedNames.add(w.course.name);
          });
        });
        setMyTargetOptions([
          { value: 'ALL', label: '내 타겟 과목' },
          ...Array.from(wantedNames).map((name) => ({
            value: name,
            label: name,
          })),
        ]);
        setMyDiscardOptions([
          { value: 'ALL', label: '내 버릴 과목' },
          ...Array.from(discardNames).map((name) => ({
            value: name,
            label: name,
          })),
        ]);
      } catch (error) {
        console.error('내 게시글 조회 실패:', error);
        setMyPostId(null);
      }
    };

    fetchMyPosts();
  }, []);

  // 2. 게시글 목록 조회 (특정 과목 필터가 걸려있으면 클라이언트에서 그 과목만 추려냄)
  const fetchPosts = useCallback(
    async (dept: string, targetFilter: string, discardFilter: string) => {
      try {
        setLoading(true);
        setLoadError(null);

        let rawPosts: BoardPostResponse[] = [];

        if (targetFilter !== 'ALL') {
          // 내가 want로 등록한 과목 중 하나를 골랐을 때: my-targets 받아서 그 과목만 추림
          const response = await axiosInstance.get('/api/posts/my-targets');
          const all: BoardPostResponse[] = response.data?.data || [];
          rawPosts = all.filter((p) => p.discardCourse?.name === targetFilter);
        } else if (discardFilter !== 'ALL') {
          // 내가 버릴 과목 중 하나를 골랐을 때: my-seekers 받아서 그 과목만 추림
          const response = await axiosInstance.get('/api/posts/my-seekers');
          const all: BoardPostResponse[] = response.data?.data || [];
          rawPosts = all.filter((p) =>
            (p.wantedCourses || []).some(
              (w) => w.course?.name === discardFilter,
            ),
          );
        } else {
          // 필터 없음: 전체 게시판 (dept 검색 + 페이지네이션)
          const response = await axiosInstance.get('/api/posts', {
            params: { dept: dept || undefined, page: 0, size: 20 },
          });
          rawPosts = response.data?.data?.content || [];
        }

        const mapped: BoardPost[] = rawPosts.map((post) => {
          const sortedWanted = [...(post.wantedCourses || [])].sort(
            (a, b) => a.priority - b.priority,
          );
          return {
            id: post.postId,
            title: post.discardCourse?.name ?? '',
            preferredSubjects: sortedWanted.map((w) => w.course?.name ?? ''),
            proposalCount: post.proposalCount ?? 0,
            alreadyProposed: false,
          };
        });

        setPosts(mapped);
      } catch (error) {
        const axiosError = error as {
          response?: {
            status?: number;
            data?: { message?: string };
          };
        };

        const status = axiosError.response?.status;
        const serverMessage = axiosError.response?.data?.message;

        console.error('게시글 목록 조회 실패:', error);
        setLoadError(
          serverMessage
            ? `(${status ?? '?'}) ${serverMessage}`
            : `목록을 불러오지 못했습니다${status ? ` (${status})` : ''}.`,
        );
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 검색(dept) 또는 과목 필터 변경 시 디바운스 처리 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts(searchQuery, targetCourseFilter, discardCourseFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, targetCourseFilter, discardCourseFilter, fetchPosts]);

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('accessToken');
    if (isLoggedIn) return; // 이미 로그인된 경우엔 안 띄움

    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (hasShownLoginModal.current) return;
      if (scrollContainer.scrollTop > 500) {
        hasShownLoginModal.current = true;
        setShowLoginModal(true);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFilterButtonClick = () => {
    const isLoggedIn = !!localStorage.getItem('accessToken');
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setShowFilterModal(true);
  };

  const handleWriteButtonClick = () => {
    const isLoggedIn = !!localStorage.getItem('accessToken');
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    navigate('/board/write');
  };

  const handlePostClick = (postId: number) => {
    const isLoggedIn = !!localStorage.getItem('accessToken');

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    navigate(`/board/${postId}`);
  };

  return (
    <div className="relative w-full min-h-screen bg-neutral-50 flex flex-col font-['Pretendard']">
      {/* 헤더: 로고 + 알림 + 메뉴 */}
      <div className="[&>header]:!border-none sticky top-0 z-40 bg-neutral-50">
        <Header
          leftNode={
            <div className="text-cyan-900 px-3 text-2xl font-bold font-['Paperlogy'] leading-9 tracking-wide">
              교환해요
            </div>
          }
          rightNode={
            <div className="flex items-center gap-2">
              <NotificationBell />
              <IconButton icon="mdi:menu" className="text-black" />
            </div>
          }
        />

        {/* 검색(학과 필터) 인풋 */}
        <div className="px-5 pb-3 bg-neutral-50">
          <div className="w-full h-9 bg-white rounded-2xl border border-gray-200 px-4 flex items-center justify-between">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="교환해요"
              className="flex-1 bg-transparent border-none outline-none text-xs font-light text-black placeholder-stone-300 leading-5 tracking-wide"
            />
            <Icon
              icon={ICONS.SEARCH}
              className="w-5 h-5 text-stone-300 cursor-pointer"
            />
          </div>
        </div>

        {/* 맞춤 필터: 내 타겟 과목 / 내 버릴 과목 (드롭다운, 서로 배타적) */}
        <div className="px-5 pb-3 flex items-center gap-3">
          {myPostId ? (
            <>
              <Dropdown
                options={myTargetOptions}
                value={targetCourseFilter}
                onChange={(v) => {
                  setTargetCourseFilter(v);
                  setDiscardCourseFilter('ALL');
                }}
                placeholder="내 타겟 과목"
                className="!w-32 [&>button]:!bg-slate-100 [&>button]:!border [&>button]:!border-blue-400 [&>button]:!rounded-2xl [&>button]:!text-slate-600 [&>button]:!text-xs [&>button]:!font-light"
              />
              <Dropdown
                options={myDiscardOptions}
                value={discardCourseFilter}
                onChange={(v) => {
                  setDiscardCourseFilter(v);
                  setTargetCourseFilter('ALL');
                }}
                placeholder="내 버릴 과목"
                className="!w-32 [&>button]:!bg-slate-100 [&>button]:!border [&>button]:!border-blue-400 [&>button]:!rounded-2xl [&>button]:!text-slate-600 [&>button]:!text-xs [&>button]:!font-light"
              />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleFilterButtonClick}
                className="w-28 flex items-center justify-between px-3.5 py-2 bg-slate-100 border border-blue-400 rounded-2xl text-xs text-slate-600 font-light"
              >
                <span>내 타겟 과목</span>
                <Icon icon="ph:caret-down" className="text-cyan-900" />
              </button>
              <button
                type="button"
                onClick={handleFilterButtonClick}
                className="w-28 flex items-center justify-between px-3.5 py-2 bg-slate-100 border border-blue-400 rounded-2xl text-xs text-slate-600 font-light"
              >
                <span>내 버릴 과목</span>
                <Icon icon="ph:caret-down" className="text-cyan-900" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            목록을 불러오는 중입니다...
          </div>
        ) : loadError ? (
          <div className="flex h-[60vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <Icon
                icon="mdi:alert-circle-outline"
                className="w-9 h-9 text-rose-400"
              />
              <p className="text-zinc-700 text-sm font-medium">
                게시글 목록을 불러오지 못했어요.
              </p>
              <p className="text-neutral-400 text-xs">{loadError}</p>
              <button
                onClick={() =>
                  fetchPosts(
                    searchQuery,
                    targetCourseFilter,
                    discardCourseFilter,
                  )
                }
                className="mt-1 px-4 py-2 bg-brand-lightBlue text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center">
            <EmptyState
              className="min-h-0"
              title="등록된 교환 게시글이 없어요."
              description="첫 번째 교환 게시글을 작성해보세요!"
            />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 pb-28">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="py-6 flex flex-col relative cursor-pointer hover:bg-black/[0.01] transition-colors"
              >
                {/* 제목 */}
                <h3 className="text-lg font-medium text-black leading-5 tracking-wide">
                  {post.title}
                </h3>

                {/* 희망 과목 리스트 + 받은 요청 개수 + 상세보기 화살표 */}
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

                  <div className="absolute right-0 bottom-0 flex items-center gap-1 text-neutral-400 text-xs font-light">
                    받은 요청 {post.proposalCount}개
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-neutral-400"
                    >
                      <path
                        d="M8.59063 18.1598L14.2506 12.4998L8.59063 6.83984L7.89062 7.54984L12.8406 12.4998L7.89062 17.4498L8.59063 18.1598Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 글쓰기 FAB */}
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-md h-0 z-50 pointer-events-none">
        <FAB
          onClick={handleWriteButtonClick}
          icon={ICONS.PLUS}
          text="글쓰기"
          className="absolute bottom-28 right-8 !pointer-events-auto !w-28 !h-14 !text-neutral-600 font-semibold !bg-brand-soft"
        />
      </div>

      {/* 비로그인 안내 모달 */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        footer={
          <div className="flex flex-col w-full gap-2">
            <button
              onClick={() => {
                setShowLoginModal(false);
                navigate('/signup');
              }}
              className="w-full h-10 bg-brand-lightBlue rounded-2xl text-white text-base font-medium tracking-tight hover:opacity-90 transition-opacity"
            >
              가입하기
            </button>
            <button
              onClick={() => {
                setShowLoginModal(false);
                navigate('/login');
              }}
              className="w-full h-10 rounded-2xl outline outline-1 outline-offset-[-1px] outline-zinc-400 text-black text-base font-medium tracking-tight"
            >
              로그인
            </button>
          </div>
        }
      >
        {/* 💡 title prop 대신, 이미 w-full인 children 안에 제목까지 같이 넣음 */}
        <div className="text-left w-full">
          <p className="text-lg font-bold text-gray-900 mb-7 mt-7">
            원하는 강의를 찾으셨나요?
          </p>
          로그인하면 교환 요청, 실시간 채팅, <br />
          강의 보유 인증 등 모든 기능을 이용할 수 있습니다.
          <br />
          <br />
          원하는 강의를 찾았다면
          <br />
          지금 로그인하고 교환을 시작해보세요.
        </div>
      </Modal>

      {/* 필터 사용 전 게시글 등록 안내 모달 */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        footer={
          <div className="flex flex-col w-full gap-2">
            <button
              onClick={() => {
                setShowFilterModal(false);
                navigate('/board/write');
              }}
              className="w-full h-10 bg-brand-lightBlue rounded-2xl text-white text-base font-medium tracking-tight hover:opacity-90 transition-opacity"
            >
              게시글 등록하기
            </button>
            <button
              onClick={() => setShowFilterModal(false)}
              className="w-full h-10 rounded-2xl outline outline-1 outline-offset-[-1px] outline-zinc-400 text-black text-base font-medium tracking-tight"
            >
              취소
            </button>
          </div>
        }
      >
        맞춤 필터를 사용하려면
        <br />
        먼저 교환 게시글을 등록해 주세요
      </Modal>
    </div>
  );
};

export default BoardPage;
