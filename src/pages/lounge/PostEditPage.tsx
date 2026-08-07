import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { ICONS } from '@/constants/icons';
import Button from '@/components/common/Button';
import { NotificationBell } from '@/components/common/NotificationBell';

import { getPostDetail, updatePost } from '@/api/lounge/lounge';
import type { UpdatePostRequest, PostDetailData } from '@/types/lounge/lounge';

interface PostEditFormProps {
  postId: number;
  initialData: PostDetailData;
}

// =========================================================
// 1. 자식 컴포넌트: 폼 상태 관리 및 UI 렌더링 담당
// =========================================================
const PostEditForm = ({ postId, initialData }: PostEditFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // useEffect 없이 부모가 넘겨준 데이터를 바로 초기값으로 설정
  const [title, setTitle] = useState(initialData.title);
  const [content, setContent] = useState(initialData.content);

  const { mutate: editPost, isPending } = useMutation({
    mutationFn: (updateData: UpdatePostRequest) =>
      updatePost({ postId, data: updateData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', String(postId)] });
      queryClient.invalidateQueries({ queryKey: ['loungePosts'] });
      navigate(-1);
    },
    onError: (error) => {
      console.error('수정 실패:', error);
      alert('게시글 수정에 실패했습니다. 다시 시도해주세요.');
    },
  });

  return (
    <div className="relative w-full h-screen flex flex-col overflow-y-auto pb-[100px]">
      {/* 상단 헤더 */}
      <div className="shrink-0 [&>header]:!border-none">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title="게시글 수정"
          rightNode={<NotificationBell />}
        />
      </div>

      {/* 본문 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 pb-[150px]">
        {/* 섹션 1: 게시글 유형 */}
        <section className="space-y-3 opacity-60 pointer-events-none">
          <h3 className="text-brand-lightBlue font-bold text-[16px]">
            게시글 유형
          </h3>
          <div className="flex gap-3">
            <button
              disabled
              className={`flex-1 py-3 rounded-full border text-[14px] font-medium transition-colors ${
                initialData.type === 'TIP'
                  ? 'border-brand-lightBlue text-brand-lightBlue bg-[#F3F7FC]'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              강의꿀팁
            </button>
            <button
              disabled
              className={`flex-1 py-3 rounded-full border text-[14px] font-medium transition-colors ${
                initialData.type === 'CLOSURE'
                  ? 'border-brand-lightBlue text-brand-lightBlue bg-[#F3F7FC]'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              폐강과목
            </button>
          </div>
        </section>

        {/* 섹션 2: 과목 태그 */}
        <section className="space-y-3 opacity-60 pointer-events-none">
          <h3 className="text-brand-lightBlue font-bold text-[16px]">
            과목 태그
          </h3>

          {initialData.course ? (
            <div className="relative w-full p-5 border border-gray-300 rounded-xl bg-brand-bg flex flex-col gap-3">
              {/* 과목명 */}
              <div className="text-[16px] font-bold text-gray-800 pr-6">
                {initialData.course.name || initialData.courseName}
              </div>

              {/* 교수 및 시간 정보 */}
              <div className="flex flex-col gap-3 w-full">
                <div className="text-[13px] text-gray-500 flex flex-col gap-0.5">
                  <span>교수 : {initialData.course.professor}</span>
                  <span>시간 : {initialData.course.classTime}</span>
                </div>

                {/* 학과 및 이수구분 뱃지 */}
                <div className="flex gap-2 shrink-0">
                  {initialData.course.department && (
                    <span className="px-3 py-1 bg-[#E2F0F9] text-brand-lightBlue text-[12px] font-medium rounded-md w-fit">
                      {initialData.course.department}
                    </span>
                  )}
                  {initialData.course.courseType && (
                    <span className="px-3 py-1 bg-[#E2F0F9] text-brand-lightBlue text-[12px] font-medium rounded-md w-fit">
                      {initialData.course.courseType}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-[144px] border-2 border-dashed border-gray-400 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-600 bg-white">
              <Icon icon="ph:magnifying-glass-light" className="text-[28px]" />
              <span className="text-[14px] font-medium">
                과목 정보가 없습니다
              </span>
            </div>
          )}
        </section>

        {/* 섹션 3: 제목 및 내용 입력 */}
        <section className="space-y-3">
          <h3 className="text-brand-lightBlue font-bold text-[16px]">
            상세 내용
          </h3>
          <div className="space-y-3">
            <Input
              placeholder="제목을 입력해주세요."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="!rounded-xl focus:!border-brand-lightBlue !py-3.5"
            />
            <Textarea
              placeholder="자유롭게 선택 과목에 대한 이야기를 나누세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[180px] focus:!border-brand-lightBlue"
            />
          </div>
        </section>
      </div>

      {/* 하단 고정 버튼 & 경고 배너 영역 */}
      <div className="absolute bottom-0 left-0 w-full z-10 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] pb-safe">
        <div className="bg-[#FFF9E6] px-5 py-3 text-[13px] text-gray-700 leading-relaxed">
          <span className="font-bold text-[#D9A000]">
            게시글 유형과 과목 태그는
          </span>{' '}
          수정할 수 없습니다.
          <br />
          잘못 입력한 경우 게시글을 삭제 후 재작성해 주세요.
        </div>

        <div className="px-4 py-4 space-y-2">
          <Button
            variant="primary"
            disabled={
              !title.trim() || !content.trim() || isPending || !initialData.type
            }
            className="disabled:!bg-gray-200 disabled:!text-gray-500"
            onClick={() => {
              editPost({
                // ✅ initialData.type은 이미 'TIP' | 'CLOSURE' 타입이므로 에러가 발생하지 않습니다.
                type: initialData.type,
                title: title,
                content: content,
              });
            }}
          >
            {isPending ? '수정 중...' : '수정하기'}
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            취소
          </Button>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// 2. 부모 컴포넌트: 데이터 패칭(로딩)만 전담
// =========================================================
export const PostEditPage = () => {
  const { postId } = useParams<{ postId: string }>();

  const { data: postResponse, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostDetail(Number(postId)),
    enabled: !!postId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        불러오는 중...
      </div>
    );
  }

  // 데이터가 없을 때 예외 처리
  if (!postResponse?.data) {
    return (
      <div className="flex justify-center items-center h-screen">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <PostEditForm postId={Number(postId)} initialData={postResponse.data} />
  );
};
