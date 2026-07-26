import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

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
  mine: boolean;
}

// 💡 TODO: 실제로는 내 게시글(myPostId)의 "원하는 과목"/"버릴 과목" 데이터를 불러와서 채워야 함
const TARGET_COURSE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'OS', label: '운영체제' },
  { value: 'SW_UNDERSTANDING', label: '소프트웨어이해' },
  { value: 'PL_THEORY', label: '프로그래밍언어론' },
];

const MY_DISCARD_COURSE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'ENGLISH_CONVERSATION', label: '영어회화' },
];

const BoardPage = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(''); // 💡 GET /api/posts의 dept 파라미터로 사용됨 (자유 검색어 아님)
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposingId, setProposingId] = useState<number | null>(null);

  // 💡 내 게시글 정보: /api/posts/me로 조회
  const [myPostId, setMyPostId] = useState<number | null>(null); // 제안 보낼 때 senderPostId로 사용
  const [myPostIds, setMyPostIds] = useState<Set<number>>(new Set()); // "내 글" 여부 판별용

  // 💡 비로그인 상태에서 스크롤 시 로그인/가입 유도 모달
  const [showLoginModal, setShowLoginModal] = useState(false);
  const hasShownLoginModal = useRef(false);

  // 💡 게시글 미등록 상태에서 메뉴(필터) 버튼 클릭 시 안내 모달
  const [showFilterModal, setShowFilterModal] = useState(false);

  // 💡 맞춤 필터 (내 타겟 과목 / 내 버릴 과목)
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [targetCourseFilter, setTargetCourseFilter] = useState('ALL');
  const [discardCourseFilter, setDiscardCourseFilter] = useState('ALL');
  const isFilterApplied =
    targetCourseFilter !== 'ALL' || discardCourseFilter !== 'ALL';

  // 1. 내 게시글 목록 조회 (senderPostId 확보 + "내 글" 판별용)
  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const response = await axiosInstance.get('/api/posts/me');
        const myPosts: MyPostResponse[] = response.data?.data || [];

        setMyPostIds(new Set(myPosts.map((p) => p.postId)));

        // 제안을 보낼 때 쓸 postId: 교환 가능(MATCHABLE) 상태인 첫 게시글 기준
        const activePost = myPosts.find((p) => p.status === 'MATCHABLE');
        setMyPostId(activePost ? activePost.postId : null);
      } catch (error) {
        console.error('내 게시글 조회 실패:', error);
        setMyPostId(null);
      }
    };

    fetchMyPosts();
  }, []);

  // 2. 게시글 목록 조회 (dept 필터 + 페이지네이션)
  const fetchPosts = useCallback(
    async (dept: string) => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/posts', {
          params: { dept: dept || undefined, page: 0, size: 20 },
        });

        const rawPosts: BoardPostResponse[] =
          response.data?.data?.content || [];

        const mapped: BoardPost[] = rawPosts.map((post) => {
          const sortedWanted = [...(post.wantedCourses || [])].sort(
            (a, b) => a.priority - b.priority,
          );
          return {
            id: post.postId,
            title: post.discardCourse?.name ?? '',
            preferredSubjects: sortedWanted.map((w) => w.course?.name ?? ''),
            proposalCount: post.proposalCount,
            alreadyProposed: false,
            mine: myPostIds.has(post.postId),
          };
        });

        setPosts(mapped);
      } catch (error) {
        console.error('게시글 목록 조회 실패:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [myPostIds],
  );

  // 검색(dept) 입력 시 디바운스 처리 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchPosts]);

  // 💡 로그인 안 한 상태(accessToken 없음)에서 스크롤하면 안내 모달을 한 번 띄움
  // (DefaultLayout의 실제 스크롤 컨테이너는 window가 아니라 #main-scroll-container)
  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('accessToken');
    if (isLoggedIn) return; // 이미 로그인된 경우엔 안 띄움

    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (hasShownLoginModal.current) return;
      if (scrollContainer.scrollTop > 1000) {
        hasShownLoginModal.current = true;
        setShowLoginModal(true);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePropose = async (e: React.MouseEvent, receiverPostId: number) => {
    e.stopPropagation();

    if (!myPostId) {
      console.warn('내 게시글 ID(myPostId)가 없어 제안을 보낼 수 없습니다.');
      alert('내 게시글 정보가 없어 제안을 보낼 수 없습니다.');
      return;
    }

    try {
      setProposingId(receiverPostId);
      const response = await axiosInstance.post('/api/proposals', {
        senderPostId: myPostId,
        receiverPostId,
      });

      if (response.data?.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === receiverPostId ? { ...p, alreadyProposed: true } : p,
          ),
        );
      }
    } catch (error) {
      console.error('제안 생성 실패:', error);
      alert('제안을 보내는 중 오류가 발생했습니다.');
    } finally {
      setProposingId(null);
    }
  };

  // 💡 "필터 열기/닫기" 문구 버튼: 게시글 등록 여부와 무관하게 그냥 토글
  const handleFilterToggleClick = () => {
    setShowFilterPanel((prev) => !prev);
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
            <div className="flex items-center gap-3">
              <IconButton
                icon={ICONS.BELL}
                onClick={() => navigate('/notifications')}
                className="text-black"
              />
              <IconButton
                icon="mdi:menu"
                className="text-black"
                // TODO: 이 메뉴 버튼이 실제로 뭘 열어야 하는지 정해지면 onClick 연결
              />
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

        {/* 맞춤 필터 열기/닫기 토글 (게시글 등록 여부와 무관하게 항상 표시) */}
        <div className="px-5 pb-3">
          <button
            onClick={handleFilterToggleClick}
            className="flex items-center gap-1.5 text-zinc-900 text-sm"
          >
            <Icon icon="mdi:filter-variant" className="w-4 h-4" />
            {showFilterPanel ? '필터 닫기' : '필터 열기'}
          </button>
        </div>

        {/* 맞춤 필터: 내 타겟 과목 / 내 버릴 과목 */}
        {showFilterPanel && (
          <div className="px-5 pb-3 flex items-center gap-3">
            <div className="flex-1">
              {myPostId ? (
                <Dropdown
                  options={TARGET_COURSE_OPTIONS}
                  value={targetCourseFilter}
                  onChange={setTargetCourseFilter}
                  placeholder="내 타겟 과목"
                  className="[&>button]:!bg-blue-100 [&>button]:!border-none [&>button]:!rounded-3xl [&>button]:!text-brand-lightBlue [&>button]:!font-medium"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFilterModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-100 border-none rounded-3xl text-sm text-brand-lightBlue font-medium"
                >
                  <span>내 타겟 과목</span>
                  <Icon icon="ph:caret-down" className="text-brand-lightBlue" />
                </button>
              )}
            </div>
            <div className="flex-1">
              {myPostId ? (
                <Dropdown
                  options={MY_DISCARD_COURSE_OPTIONS}
                  value={discardCourseFilter}
                  onChange={setDiscardCourseFilter}
                  placeholder="내 버릴 과목"
                  className="[&>button]:!bg-blue-100 [&>button]:!border-none [&>button]:!rounded-3xl [&>button]:!text-brand-lightBlue [&>button]:!font-medium"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFilterModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-100 border-none rounded-3xl text-sm text-brand-lightBlue font-medium"
                >
                  <span>내 버릴 과목</span>
                  <Icon icon="ph:caret-down" className="text-brand-lightBlue" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 게시글 목록 */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            목록을 불러오는 중입니다...
          </div>
        ) : posts.length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center">
            <EmptyState
              className="min-h-0"
              title="등록된 교환 게시글이 없어요."
              description="첫 번째 교환 게시글을 작성해보세요!"
            />
          </div>
        ) : isFilterApplied ? (
          // 💡 맞춤 필터 적용 시: 와이어프레임 스타일(인디고 테두리 박스)로 렌더링
          <div className="flex flex-col gap-3 pb-28 pt-2">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/board/${post.id}`)}
                className="bg-white rounded-lg border-2 border-brand-lightBlue p-6 cursor-pointer hover:bg-blue-50/30 transition-colors"
              >
                <h3 className="text-zinc-900 text-xl font-normal leading-8">
                  {post.title}
                </h3>
                <p className="text-zinc-900 text-base font-normal leading-6 mt-3">
                  {post.preferredSubjects.map((subject, index) => (
                    <React.Fragment key={index}>
                      {index + 1}순위 : {subject}
                      {index < post.preferredSubjects.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </p>
                <div className="flex items-center justify-end gap-1 mt-3 text-neutral-500 text-sm">
                  <Icon icon="mdi:eye-outline" className="w-5 h-5" />
                  받은 요청 {post.proposalCount}개
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 pb-28">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/board/${post.id}`)}
                className="py-6 flex flex-col relative cursor-pointer hover:bg-black/[0.01] transition-colors"
              >
                {/* 제목 + 제안 버튼 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-black leading-5 tracking-wide">
                    {post.title}
                  </h3>

                  {!post.mine && (
                    <button
                      onClick={(e) => handlePropose(e, post.id)}
                      disabled={post.alreadyProposed || proposingId === post.id}
                      className={`px-4 py-1 rounded-full text-xs font-medium transition-opacity ${
                        post.alreadyProposed
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-brand-lightBlue text-white hover:opacity-90'
                      } ${proposingId === post.id ? 'opacity-60' : ''}`}
                    >
                      {post.alreadyProposed ? '제안 완료' : '제안'}
                    </button>
                  )}
                </div>

                {/* 희망 과목 리스트 + 상세보기 화살표 */}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 글쓰기 FAB */}
      <FAB
        onClick={() => navigate('/board/write')}
        icon={ICONS.PLUS}
        text="글쓰기"
        className="!fixed !w-28 !h-14 justify-center !text-neutral-600 text-lg font-semibold font-['Pretendard'] leading-5 tracking-wide !bg-sky-200 !rounded-[30.50px] !shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]"
      />

      {/* 💡 하단 네비게이션 바는 라우터의 DefaultLayout이 자동으로 렌더링하므로 여기서 별도로 넣지 않음 */}

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
