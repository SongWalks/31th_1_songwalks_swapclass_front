import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { FAB } from '@/components/common/FAB';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import Header from '@/components/layout/Header';
import { Input } from '@/components/common/Input';
import { FilterChip } from '@/components/common/FilterChip';
import { useLounge } from '../../store/useLounge';
import { ICONS } from '@/constants/icons';
import { IconButton } from '@/components/common/IconButton';
import { useWriteStore } from '@/store/useWriteStore';
import { PostCard } from '@/components/common/PostCard';
import { getLoungePosts } from '@/api/lounge.ts';
import type { Post } from '@/components/common/PostCard';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

export const LoungePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resetWriteData = useWriteStore((state) => state.resetWriteData);
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedType,
    selectedCourses,
    handleAddCourse,
    hasActiveFilters,
    handleResetFilters,
    handleRemoveCourse,
    handleToggleType,
  } = useLounge();

  const apiType =
    selectedType === '강의꿀팁'
      ? 'TIP'
      : selectedType === '폐강과목'
        ? 'CLOSURE'
        : undefined;

  // (임시) 현재 selectedCourses가 이름(string) 배열이므로, 당장 courseId를 넘기긴 어렵습니다.
  // 백엔드가 int를 요구하므로 일단 undefined로 비워두거나, 스토어를 id 배열로 수정해야 완벽해집니다.
  const courseIdParam = undefined;

  // React Query로 서버 데이터 땡겨오기
  const { data: responseData, isLoading } = useQuery({
    queryKey: ['loungePosts', apiType, searchQuery, courseIdParam],
    queryFn: () =>
      getLoungePosts({
        type: apiType,
        keyword: searchQuery || undefined,
        courseId: courseIdParam,
      }),
  });

  // 서버 데이터를 PostCard 형식에 맞게 예쁘게 재포장(Mapping)
  const formattedPosts: Post[] = (responseData?.data?.posts || []).map(
    (serverPost) => ({
      id: serverPost.id,
      title: serverPost.title,
      content: serverPost.content,

      date: formatDate(serverPost.createdAt),

      // 서버의 'TIP', 'CLOSURE'를 뱃지용 '강의꿀팁', '폐강과목'으로 번역
      postType:
        serverPost.type === 'TIP'
          ? '강의꿀팁'
          : serverPost.type === 'CLOSURE'
            ? '폐강과목'
            : undefined,
      courseTag: serverPost.courseName,
      likes: serverPost.likeCount,
      comments: serverPost.commentCount,
    }),
  );

  // ✅ 수정 1: 공통 필터 페이지에서 선택한 과목을 들고 돌아왔을 때 실행되는 로직
  useEffect(() => {
    // newCourse 대신 selectedCourse로 데이터를 받습니다.
    if (location.state?.selectedCourse) {
      // 선택된 과목 전체 '객체'가 넘어오므로, 라운지 필터에 쓸 '과목명(title)'만 추출합니다.
      const courseToAdd = location.state.selectedCourse.title;

      handleAddCourse(courseToAdd);

      // 새로고침 시 다시 추가되는 것을 막기 위해 location.state 초기화
      // 하드코딩된 '/lounge' 대신 location.pathname을 사용하여 더 유연하게 대처합니다.
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, handleAddCourse, location.pathname]);

  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col overflow-hidden">
      {/* 1. 상단 헤더 영역 */}
      <div className="shrink-0 w-full z-20">
        <div className="[&>header]:!border-none">
          <Header
            title="라운지"
            rightNode={
              <IconButton
                icon={ICONS.BELL}
                onClick={() => {}}
                className="text-gray-800"
              />
            }
          />
        </div>
      </div>

      {/* 2. 상단 TABS 영역 */}
      <div className="px-4 shrink-0 z-20 border-b border-gray-100">
        <Tabs
          variant="line"
          activeTabId={activeTab}
          onTabChange={setActiveTab}
          tabs={[
            { id: 'target', label: '내 타겟 과목' },
            { id: 'drop', label: '내 버릴 과목' },
          ]}
        />
      </div>

      {/* 3. 콘텐츠 영역 (스크롤) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative pb-24">
        {/* 일반 라운지 모드 컨트롤 */}
        <div className="py-4 space-y-3">
          <div className="px-4">
            <Input
              variant="pill"
              placeholder="검색어를 입력해주세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightNode={
                <Icon
                  icon={ICONS.SEARCH}
                  className="text-[20px] text-gray-400"
                />
              }
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {/* 화면 왼쪽 끝 여백 */}
            <div className="w-4 shrink-0" />

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="ph:arrow-counter-clockwise" className="text-xl" />
              </button>
            )}
            <FilterChip
              label="강의꿀팁"
              isActive={selectedType === '강의꿀팁'}
              onClick={() => handleToggleType('강의꿀팁')}
            />
            <FilterChip
              label="폐강과목"
              isActive={selectedType === '폐강과목'}
              onClick={() => handleToggleType('폐강과목')}
            />
            {selectedCourses.map((course) => (
              <FilterChip
                key={course}
                label={course}
                isActive={true}
                hasClose
                onClose={() => handleRemoveCourse(course)}
              />
            ))}

            {/* ✅ 수정 2: 공통 필터 페이지로 이동할 때 '돌아올 현재 주소'를 전달 */}
            <button
              onClick={() =>
                navigate('/course-search', {
                  state: { returnPath: location.pathname },
                })
              }
              className="bg-brand-bg shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border border-brand-lightBlue text-brand-lightBlue text-[14px] whitespace-nowrap"
            >
              과목 필터
              <Icon icon="ph:caret-down" className="text-[14px]" />
            </button>

            {/* 화면 오른쪽 끝 여백 */}
            <div className="w-4 shrink-0" />
          </div>
        </div>

        {/* 게시글 리스트 영역 */}
        <div className="px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-500 py-10">
              데이터를 불러오는 중입니다...
            </div>
          ) : formattedPosts.length === 0 ? (
            <EmptyState title="검색 결과가 없습니다" />
          ) : (
            // 💡 4️⃣ 재포장한 formattedPosts를 돌리면서 PostCard에 꽂아줍니다.
            formattedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => navigate(`/post/${post.id}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* FAB 버튼 */}
      <FAB
        icon={ICONS.PLUS}
        onClick={() => {
          resetWriteData();
          navigate('/lounge/write');
        }}
      />
    </div>
  );
};
