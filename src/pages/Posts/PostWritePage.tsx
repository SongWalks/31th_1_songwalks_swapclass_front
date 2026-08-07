import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ICONS } from '@/constants/icons';
import axiosInstance from '@/api/axiosInstance';

import throwArrow from '@/assets/icons/posts/throw_arrow.svg';
import wantArrow from '@/assets/icons/posts/want_arrow.svg';

interface CourseSelection {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
}

interface RestoredForm {
  discardCourse: CourseSelection | null;
  wantedCourses: (CourseSelection | null)[];
}

const readRestoredForm = (): RestoredForm => {
  let restoredDiscard: CourseSelection | null = null;
  let restoredWanted: (CourseSelection | null)[] = [null, null, null];

  const rawForm = sessionStorage.getItem('postWriteFormState');
  if (rawForm) {
    try {
      const form = JSON.parse(rawForm);
      restoredDiscard = form.discardCourse ?? null;
      restoredWanted = form.wantedCourses ?? [null, null, null];
    } catch (error) {
      console.error('작성 중이던 내용을 복원하지 못했습니다.', error);
    }
  }

  const rawCourse = sessionStorage.getItem('selectedCourse');
  if (rawCourse) {
    try {
      const selected = JSON.parse(rawCourse);
      const rawTarget = sessionStorage.getItem('courseSearchTarget');
      const targetInfo = rawTarget ? JSON.parse(rawTarget) : null;
      const courseSelection: CourseSelection = {
        courseId: selected.courseId,
        // 💡 팀원분 코드가 title: course.name으로도 같이 저장해두니, name 없으면 title로 대체
        name: selected.name ?? selected.title,
        professor: selected.professor,
        classTime: selected.classTime,
        department: selected.department,
        courseType: selected.courseType,
      };

      if (targetInfo?.target === 'discard') {
        restoredDiscard = courseSelection;
      } else if (
        targetInfo?.target === 'wanted' &&
        typeof targetInfo.priority === 'number'
      ) {
        restoredWanted = [...restoredWanted];
        restoredWanted[targetInfo.priority] = courseSelection;
      }
    } catch (error) {
      console.error('선택한 과목 정보를 읽지 못했습니다.', error);
    }
  }

  return { discardCourse: restoredDiscard, wantedCourses: restoredWanted };
};

const PostWritePage: React.FC = () => {
  const navigate = useNavigate();

  // 💡 lazy initializer로 한 번만 계산 (컴포넌트 함수가 리렌더될 때마다 다시 안 돌아감)
  const [initialForm] = useState(readRestoredForm);
  const [discardCourse, setDiscardCourse] = useState<CourseSelection | null>(
    initialForm.discardCourse,
  );
  const [wantedCourses, setWantedCourses] = useState<
    (CourseSelection | null)[]
  >(initialForm.wantedCourses);

  const [createdPostId, setCreatedPostId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 💡 한 번 읽었으니 새로 글쓰기 들어왔을 때 예전 값이 안 남게 정리.
  // setState를 전혀 호출하지 않는 effect라 set-state-in-effect 규칙 대상이 아님.
  useEffect(() => {
    sessionStorage.removeItem('postWriteFormState');
    sessionStorage.removeItem('selectedCourse');
    sessionStorage.removeItem('courseSearchTarget');
  }, []);

  // 💡 등록하기 버튼 활성화 조건: 버릴 과목 1개 + 원하는 과목 1개 이상
  const canSubmit =
    !!discardCourse && wantedCourses.some((course) => course !== null);

  const handleSelectDiscardCourse = () => {
    // 💡 지금까지의 전체 선택 상태 + 어느 슬롯을 채울지 sessionStorage에 저장해두고 이동
    sessionStorage.setItem(
      'postWriteFormState',
      JSON.stringify({ discardCourse, wantedCourses }),
    );
    sessionStorage.setItem(
      'courseSearchTarget',
      JSON.stringify({ target: 'discard' }),
    );
    navigate('/course-search');
  };

  const handleSelectWantedCourse = (index: number) => {
    sessionStorage.setItem(
      'postWriteFormState',
      JSON.stringify({ discardCourse, wantedCourses }),
    );
    sessionStorage.setItem(
      'courseSearchTarget',
      JSON.stringify({ target: 'wanted', priority: index }),
    );
    navigate('/course-search');
  };

  const handleRemoveWantedCourse = (index: number) => {
    setWantedCourses((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!discardCourse) throw new Error('버릴 과목이 없습니다.');
      // 💡 원하는 과목은 배열 순서 = 우선순위(1,2,3순위). 빈 슬롯(null)은 제외하고 보냄
      const wantedCourseIds = wantedCourses
        .filter((course): course is CourseSelection => course !== null)
        .map((course) => course.courseId);

      const response = await axiosInstance.post('/api/posts', {
        discardCourseId: discardCourse.courseId,
        wantedCourseIds,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (!data?.success) return;
      setCreatedPostId(data.data?.postId ?? null);
      setShowSuccessModal(true);
    },
    onError: (error) => {
      console.error('게시글 등록 실패:', error);
      alert('게시글 등록 중 오류가 발생했습니다.');
    },
  });

  const handleSubmit = () => {
    if (!canSubmit || submitMutation.isPending) return;
    submitMutation.mutate();
  };

  return (
    <div className="relative w-full min-h-screen bg-neutral-50 flex flex-col font-['Pretendard']">
      {/* 헤더: Header.tsx는 안 건드리고, 타이틀만 이 페이지에서 별도로 정중앙 오버레이 */}
      <div className="[&>header]:!border-none relative sticky top-0 z-40 bg-neutral-50">
        <Header
          leftNode={
            <Icon
              icon={ICONS.CLOSE}
              onClick={() => navigate('/board')}
              className="w-6 h-6 text-neutral-400 cursor-pointer"
            />
          }
        />
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <span className="pointer-events-auto">교환글 작성하기</span>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-32">
        {/* 버릴 과목 */}
        <section className="mb-9">
          <h2 className="text-point-red text-base font-bold mb-3 tracking-wide">
            버릴 과목
          </h2>

          {discardCourse ? (
            <CourseCard
              title={discardCourse.name}
              professor={discardCourse.professor}
              time={discardCourse.classTime}
              className="!bg-[#FFF0F0] !border-0 outline outline-[0.25px] outline-offset-[-0.25px] !outline-gray-200 !rounded-xl"
              leftNode={
                <div className="relative w-7 h-7 shrink-0 mt-0.5 flex items-center justify-center">
                  <div className="size-6 bg-rose-200 rounded-full" />
                  <img
                    src={throwArrow}
                    alt="throw"
                    className="absolute size-6"
                  />
                </div>
              }
              rightNode={
                <IconButton
                  icon="ph:x"
                  variant="ghost"
                  className="p-1 -mr-1 -mt-1 text-gray-400"
                  onClick={() => setDiscardCourse(null)}
                />
              }
              badges={
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="lightRed"
                    className="!border !border-neutral-400 !text-zinc-900 !font-normal !rounded-lg"
                  >
                    {discardCourse.courseType}
                  </Badge>
                  {discardCourse.department && (
                    <Badge
                      variant="lightRed"
                      className="!border !border-neutral-400 !text-zinc-900 !font-normal !rounded-lg"
                    >
                      {discardCourse.department}
                    </Badge>
                  )}
                </div>
              }
            />
          ) : (
            <button
              onClick={handleSelectDiscardCourse}
              className="w-full py-6 flex flex-col items-center justify-center gap-1 bg-white rounded-lg border-2 border-dashed border-neutral-400 hover:bg-gray-50 transition-colors"
            >
              <Icon
                icon={ICONS.SEARCH}
                className="w-8 h-8 text-neutral-400 mb-1"
              />
              <span className="text-zinc-900 text-base">과목 검색하기</span>
              <span className="text-neutral-500 text-xs">
                등록 후 수정할 수 없으니 신중하게 선택해주세요
              </span>
            </button>
          )}
        </section>

        {/* 원하는 과목 */}
        <section className="mb-10">
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-brand-lightBlue text-base font-bold tracking-wide">
              원하는 과목
            </h2>
            <p className="text-neutral-500 text-xs font-normal">
              최소 1개 이상 선택해주세요
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((index) => {
              const course = wantedCourses[index];
              return (
                <div key={index}>
                  <div className="text-zinc-900 text-xs font-medium mb-2 ml-1">
                    {index + 1}순위
                  </div>

                  {course ? (
                    <CourseCard
                      title={course.name}
                      professor={course.professor}
                      time={course.classTime}
                      className="!bg-[#F4F8FB] !border-0 outline outline-[0.25px] outline-offset-[-0.25px] !outline-gray-200 !rounded-xl"
                      leftNode={
                        <div className="relative w-7 h-6 shrink-0 mt-0.5 flex items-center justify-center">
                          <div className="size-6 bg-sky-200 rounded-full" />
                          <img
                            src={wantArrow}
                            alt="want"
                            className="absolute size-5"
                          />
                        </div>
                      }
                      rightNode={
                        <IconButton
                          icon="ph:x"
                          variant="ghost"
                          className="p-1 -mr-1 -mt-1 text-gray-400"
                          onClick={() => handleRemoveWantedCourse(index)}
                        />
                      }
                      badges={
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant="lightBlueOutline"
                            className="!font-normal !rounded-lg"
                          >
                            {course.courseType}
                          </Badge>
                          {course.department && (
                            <Badge
                              variant="lightBlueOutline"
                              className="!font-normal !rounded-lg"
                            >
                              {course.department}
                            </Badge>
                          )}
                        </div>
                      }
                    />
                  ) : (
                    <button
                      onClick={() => handleSelectWantedCourse(index)}
                      className="w-full h-9 bg-white rounded-md border-[0.7px] border-zinc-400 px-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-zinc-400 text-sm">
                        과목을 검색해주세요.
                      </span>
                      <Icon
                        icon={ICONS.SEARCH}
                        className="w-5 h-5 text-neutral-400"
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 안내사항 */}
        <section className="mb-6">
          <div className="w-full bg-[#E6EFF5] rounded-xl border border-brand-lightBlue p-5">
            <h3 className="text-zinc-900 text-lg font-semibold mb-3">
              안내사항
            </h3>
            <p className="text-zinc-900 text-xs font-light leading-relaxed">
              버릴 과목은 등록 후 수정할 수 없습니다
              <br />
              원하는 과목은 수정이 가능합니다
              <br />
              매칭 전 상태에서만 게시글 삭제가 가능합니다
              <br />
              같은 과목으로 여러 개의 게시글을 작성할 수 없습니다
            </p>
          </div>
        </section>
      </div>

      {/* 하단 고정 등록하기 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] px-4 pb-6 pt-3">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitMutation.isPending}
          className={`w-full h-14 text-white text-lg font-semibold tracking-wide transition-all ${
            canSubmit
              ? 'bg-brand-lightBlue rounded-2xl hover:opacity-90 cursor-pointer'
              : 'bg-zinc-400 rounded-md shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] cursor-not-allowed'
          } ${submitMutation.isPending ? 'opacity-60' : ''}`}
        >
          {submitMutation.isPending ? '등록 중...' : '등록하기'}
        </button>
      </div>

      {/* 등록 성공 모달 */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        footer={
          <div className="flex flex-col w-full gap-2">
            <button
              onClick={() => {
                setShowSuccessModal(false);
                navigate(createdPostId ? `/board/${createdPostId}` : '/board');
              }}
              className="w-full h-10 bg-brand-lightBlue rounded-2xl text-white text-base font-medium tracking-tight hover:opacity-90 transition-opacity"
            >
              확인
            </button>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full h-10 rounded-2xl outline outline-1 outline-offset-[-1px] outline-zinc-400 text-black text-base font-medium tracking-tight"
            >
              취소
            </button>
          </div>
        }
      >
        교환글 작성이 성공적으로
        <br />
        등록되었습니다
      </Modal>
    </div>
  );
};

export default PostWritePage;
