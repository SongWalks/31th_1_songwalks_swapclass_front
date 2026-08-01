import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { ICONS } from '@/constants/icons';
import Button from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { useWriteStore } from '@/store/useWriteStore';
import { createPost } from '@/api/lounge/lounge';
import type { CreatePostRequest } from '@/types/lounge/lounge';
import { NotificationBell } from '@/components/common/NotificationBell';

export const LoungeWritePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { postType, courseTag, title, content, setWriteData, resetWriteData } =
    useWriteStore();

  useEffect(() => {
    const savedCourseStr = sessionStorage.getItem('selectedCourse');

    if (savedCourseStr) {
      try {
        const course = JSON.parse(savedCourseStr);
        sessionStorage.removeItem('selectedCourse'); // 💡 데이터 꼬임 방지를 위해 꺼낸 직후 바로 삭제!

        const newBadges: { label: string; variant: string }[] = [];
        if (course.isGraduationReq)
          newBadges.push({ label: '졸업요건', variant: 'blue' });
        if (course.category)
          newBadges.push({ label: course.category, variant: 'blue' });
        if (course.department)
          newBadges.push({ label: course.department, variant: 'blue' });

        const formattedTag = {
          id: course.courseId,
          title: course.title,
          professor: course.professor || '미상',
          time: course.classTime || '미정',
          badges: newBadges,
        };

        setWriteData({ courseTag: formattedTag });
      } catch (error) {
        console.error('과목 데이터를 파싱하는데 실패했습니다.', error);
      }
    }
  }, [setWriteData]);

  const { mutate: submitPost, isPending } = useMutation({
    mutationFn: (data: CreatePostRequest) => createPost(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['loungePosts'] });

        resetWriteData();
        navigate('/lounge', { replace: true });
      }
    },
    onError: (error) => {
      console.error('글 등록 실패:', error);
      alert('게시글 등록에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !postType || !courseTag) return;

    const requestData: CreatePostRequest = {
      type: postType === '강의꿀팁' ? 'TIP' : 'CLOSURE',
      courseId: courseTag.id,
      title: title.trim(),
      content: content.trim(),
    };

    submitPost(requestData);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* 1. 상단 헤더 */}
      <div className="shrink-0 [&>header]:!border-none">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title="글쓰기"
          rightNode={<NotificationBell />}
        />
      </div>

      {/* 2. 본문 영역 (스크롤 가능) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
        {/* 섹션 1: 게시글 유형 */}
        <section className="space-y-3">
          <h3 className="text-brand-lightBlue font-bold text-[16px]">
            게시글 유형
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setWriteData({ postType: '강의꿀팁' })}
              className={`flex-1 py-3 rounded-full border text-[14px] font-medium transition-colors ${
                postType === '강의꿀팁'
                  ? 'border-brand-lightBlue text-brand-lightBlue bg-[#F3F7FC]'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              강의꿀팁
            </button>
            <button
              onClick={() => setWriteData({ postType: '폐강과목' })}
              className={`flex-1 py-3 rounded-full border text-[14px] font-medium transition-colors ${
                postType === '폐강과목'
                  ? 'border-brand-lightBlue text-brand-lightBlue bg-[#F3F7FC]'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              폐강과목
            </button>
          </div>
        </section>

        {/* 섹션 2: 과목 태그 */}
        <section className="space-y-3">
          <h3 className="text-brand-lightBlue font-bold text-[16px]">
            과목 태그
          </h3>

          {courseTag ? (
            <div className="relative w-full p-5 border border-gray-300 rounded-xl bg-brand-bg flex flex-col gap-3">
              <button
                onClick={() => setWriteData({ courseTag: null })}
                className="absolute top-4 right-4 text-gray-400 p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Icon icon="ph:x" className="text-[20px]" />
              </button>

              <div className="text-[16px] font-bold text-gray-800 pr-6">
                {courseTag.title}
              </div>

              <div className="flex flex-col gap-3 w-full">
                <div className="text-[13px] text-gray-500 flex flex-col gap-0.5">
                  <span>교수 : {courseTag.professor}</span>
                  <span>시간 : {courseTag.time}</span>
                </div>

                <div className="flex gap-2 shrink-0">
                  {courseTag.badges.map((badge: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#E2F0F9] text-brand-lightBlue text-[12px] font-medium rounded-md w-fit"
                    >
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/course-search')}
              className="w-full h-[144px] border-2 border-dashed border-gray-400 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            >
              <Icon icon="ph:magnifying-glass-light" className="text-[28px]" />
              <span className="text-[14px] font-medium">과목 검색하기</span>
            </button>
          )}
        </section>

        {/* 섹션 3: 제목 및 내용 입력 */}
        <section className="space-y-3 pb-10">
          <h3 className="text-brand-lightBlue font-bold text-[16px]">
            상세 내용
          </h3>
          <div className="space-y-3">
            <Input
              placeholder="제목을 입력해주세요."
              value={title}
              onChange={(e) => setWriteData({ title: e.target.value })}
              className="!rounded-xl focus:!border-brand-lightBlue !py-3.5"
            />
            <Textarea
              placeholder="자유롭게 선택 과목에 대한 이야기를 나누세요."
              value={content}
              onChange={(e) => setWriteData({ content: e.target.value })}
              className="min-h-[180px] focus:!border-brand-lightBlue"
            />
          </div>
        </section>
      </div>

      {/* 3. 하단 고정 버튼 영역 */}
      <div className="shrink-0 px-4 py-4 space-y-2 pb-safe">
        <Button
          variant="primary"
          disabled={
            !title.trim() ||
            !content.trim() ||
            !postType ||
            !courseTag ||
            isPending
          }
          className="disabled:!bg-gray-200 disabled:!text-gray-500"
          onClick={handleSubmit}
        >
          {isPending ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner
                size="sm"
                className="!border-white !border-t-transparent w-5 h-5 border-2"
              />
              <span>등록 중...</span>
            </div>
          ) : (
            '등록하기'
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={isPending}
        >
          취소
        </Button>
      </div>
    </div>
  );
};
