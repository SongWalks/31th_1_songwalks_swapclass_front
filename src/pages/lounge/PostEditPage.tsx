import { useState, useEffect } from 'react';
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
// ✅ 분리해둔 타입을 가져옵니다.
import type { UpdatePostRequest } from '@/types/lounge/lounge';

export const PostEditPage = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: postResponse, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostDetail(Number(postId)),
    enabled: !!postId,
  });

  useEffect(() => {
    if (postResponse?.data) {
      setTitle(postResponse.data.title);
      setContent(postResponse.data.content);
    }
  }, [postResponse]);

  // 🚀 타입을 하드코딩하지 않고 Import 해온 UpdatePostRequest 사용
  const { mutate: editPost, isPending } = useMutation({
    mutationFn: (updateData: UpdatePostRequest) =>
      updatePost({ postId: Number(postId), data: updateData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['loungePosts'] });
      navigate(-1);
    },
    onError: (error) => {
      console.error('수정 실패:', error);
      alert('게시글 수정에 실패했습니다. 다시 시도해주세요.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        불러오는 중...
      </div>
    );
  }

  const postData = postResponse?.data;

  return (
    <div className="relative w-full h-screen flex flex-col overflow-y-auto pb-[100px]">
      {/* 1. 상단 헤더 */}
      <div className="shrink-0 [&>header]:!border-none">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title="게시글 수정"
          rightNode={<NotificationBell />}
        />
      </div>

      {/* 2. 본문 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 pb-[150px]">
        {/* 섹션 1: 게시글 유형 (비활성화) - 서버에서 받아온 type 기준 렌더링 */}
        <section className="space-y-3 opacity-60 pointer-events-none">
          <h3 className="text-brand-lightBlue font-bold text-[16px]">
            게시글 유형
          </h3>
          <div className="flex gap-3">
            <button
              disabled
              className={`flex-1 py-3 rounded-full border text-[14px] font-medium transition-colors ${
                postData?.type === 'TIP'
                  ? 'border-brand-lightBlue text-brand-lightBlue bg-[#F3F7FC]'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              강의꿀팁
            </button>
            <button
              disabled
              className={`flex-1 py-3 rounded-full border text-[14px] font-medium transition-colors ${
                postData?.type === 'CLOSURE'
                  ? 'border-brand-lightBlue text-brand-lightBlue bg-[#F3F7FC]'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}
            >
              폐강과목
            </button>
          </div>
        </section>

        {/* 섹션 2: 과목 태그 (비활성화) - 서버에서 받아온 courseName 적용 */}
        <section className="space-y-3 opacity-60 pointer-events-none">
          <h3 className="text-brand-lightBlue text-bold-16">과목 태그</h3>
          <div className="relative w-full p-5 border border-gray-300 rounded-xl bg-brand-bg flex flex-col gap-3">
            <button className="absolute top-4 right-4 text-gray-400">
              <Icon icon="ph:x" className="text-[20px]" />
            </button>
            <div className="text-[16px] font-bold text-gray-800 pr-6">
              {/* ✅ 서버에서 전달받은 과목명 사용 */}
              {postData?.courseName || '과목명 없음'}
            </div>
          </div>
        </section>

        {/* 섹션 3: 제목 및 내용 입력 (수정 가능) */}
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

      {/* 3. 하단 고정 버튼 & 경고 배너 영역 */}
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
              !title.trim() || !content.trim() || isPending || !postData?.type
            }
            className="disabled:!bg-gray-200 disabled:!text-gray-500"
            onClick={() => {
              // 🚀 TS 타입 가드: postData가 없으면 실행 안함 (TypeScript 에러 방지)
              if (!postData) return;

              editPost({
                type: postData.type,
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
