import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { ICONS } from '@/constants/icons';
import axiosInstance from '@/api/axiosInstance';

import throwArrow from '@/assets/icons/recommend/throw_arrow.svg';
import wantArrow from '@/assets/icons/recommend/want_arrow.svg';

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

interface PostDetailResponse {
  postId: number;
  status: 'MATCHABLE' | 'IN_EXCHANGE' | 'COMPLETED' | string;
  authorId: number;
  authorNickname: string;
  discardCourse: CourseDetail;
  wantedCourses: WantedCourseItem[];
  createdAt: string;
  mine: boolean;
  proposalCount: number;
}

interface CourseSelection {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
}

const STATUS_LABEL: Record<string, string> = {
  MATCHABLE: '교환 전',
  IN_EXCHANGE: '교환 중',
  COMPLETED: '교환 완료',
};

const toCourseSelection = (course: CourseDetail): CourseSelection => ({
  courseId: course.courseId,
  name: course.name,
  professor: course.professor,
  classTime: course.classTime,
  department: course.department,
  courseType: course.courseType,
});

// 💡 sessionStorage에서 "수정 중이던 원하는 과목 상태" + "방금 검색에서 고른 과목"을 읽어서 합침.
// useState의 초기값 계산 함수로 쓰이므로 렌더링 중(첫 마운트 시) 딱 한 번만 동기적으로 호출됨.
const readPendingWantedCourses = (): (CourseSelection | null)[] | null => {
  let restoredWanted: (CourseSelection | null)[] | null = null;

  const rawForm = sessionStorage.getItem('postEditFormState');
  if (rawForm) {
    try {
      const form = JSON.parse(rawForm);
      restoredWanted = form.wantedCourses ?? null;
    } catch (error) {
      console.error('수정 중이던 내용을 복원하지 못했습니다.', error);
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
        name: selected.name ?? selected.title,
        professor: selected.professor,
        classTime: selected.classTime,
        department: selected.department,
        courseType: selected.courseType,
      };

      if (
        targetInfo?.target === 'wanted' &&
        typeof targetInfo.priority === 'number'
      ) {
        const base = restoredWanted ?? [null, null, null];
        const next = [...base];
        next[targetInfo.priority] = courseSelection;
        restoredWanted = next;
      }
    } catch (error) {
      console.error('선택한 과목 정보를 읽지 못했습니다.', error);
    }
  }

  return restoredWanted;
};

const PostEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();

  // 💡 React Query로 게시글 상세 페칭. useEffect+setState도 없고, StrictMode 이중 호출로 인한
  // 중복 요청 문제도 React Query가 내부적으로 중복 제거해줘서 별도 ref 가드가 필요 없음.
  const { data: post, isLoading: loading } = useQuery({
    queryKey: ['postDetail', postId],
    queryFn: async (): Promise<PostDetailResponse> => {
      const response = await axiosInstance.get(`/api/posts/${postId}`);
      return response.data.data as PostDetailResponse;
    },
    enabled: !!postId,
  });

  // 💡 이제 별도 API로 우회 계산 안 하고, GET /api/posts/{postId} 응답의 proposalCount를
  // 바로 씀 (SpecificPostsPage.tsx와 동일한 방식)

  // 💡 서버에서 온 원하는 과목 목록을 화면용 형태로 변환 (표시용 "기본값")
  const serverWanted = useMemo((): (CourseSelection | null)[] => {
    if (!post) return [null, null, null];
    const sorted = [...post.wantedCourses].sort(
      (a, b) => a.priority - b.priority,
    );
    return [0, 1, 2].map((i) => {
      const item = sorted[i];
      return item ? toCourseSelection(item.course) : null;
    });
  }, [post]);

  // 💡 핵심: "사용자가 로컬에서 직접 바꾼 값"은 이 state 하나로만 관리하고, 서버 데이터는
  // 절대로 이 값을 덮어쓰지 않음(effect로 동기화하지 않음). 그래서 예전에 겪었던
  // "서버 응답이 늦게 도착해서 방금 고른 과목을 덮어쓰는" 경쟁 상태 버그가 구조적으로
  // 아예 발생할 수 없음 — 서버값은 "아직 로컬에서 아무것도 안 건드렸을 때의 기본값"으로만 쓰임.
  const [overrideWanted, setOverrideWanted] = useState<
    (CourseSelection | null)[] | null
  >(readPendingWantedCourses);

  const wantedCourses = overrideWanted ?? serverWanted;

  // 💡 한 번 읽었으니 정리 (setState 없는 effect라 set-state-in-effect 규칙 대상 아님)
  useEffect(() => {
    sessionStorage.removeItem('postEditFormState');
    sessionStorage.removeItem('selectedCourse');
    sessionStorage.removeItem('courseSearchTarget');
  }, []);

  const handleSelectWantedCourse = (index: number) => {
    sessionStorage.setItem(
      'postEditFormState',
      JSON.stringify({ wantedCourses }),
    );
    sessionStorage.setItem(
      'courseSearchTarget',
      JSON.stringify({ target: 'wanted', priority: index }),
    );
    navigate('/course-search');
  };

  const handleRemoveWantedCourse = (index: number) => {
    setOverrideWanted((prev) => {
      const base = prev ?? serverWanted;
      const next = [...base];
      next[index] = null;
      return next;
    });
  };

  // 💡 등록하기 버튼 활성화 조건: 버릴 과목 1개 + 원하는 과목 1순위 필수
  const canSubmit = wantedCourses[0] !== null;

  // TODO: PATCH /api/posts/{postId} 실제 요청 스키마 확인되면 그에 맞춰 수정
  const submitMutation = useMutation({
    mutationFn: async () => {
      const wantedCourseIds = wantedCourses
        .filter((course): course is CourseSelection => course !== null)
        .map((course) => course.courseId);

      const response = await axiosInstance.patch(`/api/posts/${postId}`, {
        wantedCourseIds,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.success) {
        navigate(`/board/${postId}`, { replace: true });
      }
    },
    onError: (error) => {
      console.error('게시글 수정 실패:', error);
      alert('게시글 수정 중 오류가 발생했습니다.');
    },
  });

  const handleSubmitEdit = () => {
    if (!canSubmit || !postId || submitMutation.isPending) return;
    submitMutation.mutate();
  };

  if (loading || !post) {
    return (
      <div className="relative w-full h-full flex flex-col font-['Pretendard'] bg-neutral-50">
        <div className="relative sticky top-0 z-50 bg-neutral-50">
          <Header
            leftNode={
              <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
            }
            rightNode={
              <IconButton
                icon={ICONS.MORE_VERTICAL}
                className="text-black/40"
              />
            }
          />
          <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <span className="pointer-events-auto">게시글 상세</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          불러오는 중입니다...
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col font-['Pretendard'] bg-neutral-50">
      {/* 고정 헤더 */}
      <div className="relative sticky top-0 z-50 bg-neutral-50">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          rightNode={
            <IconButton icon={ICONS.MORE_VERTICAL} className="text-black/40" />
          }
        />
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <span className="text-black/70 text-[17px] font-semibold pointer-events-auto">
            게시글 상세
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-32">
        {/* 프로필 + 상태 뱃지 */}
        <div className="flex items-center justify-between gap-3.5 py-2 px-6 border-b border-gray-200/60">
          <div className="flex items-center gap-3.5">
            <Avatar size="md" />
            <div className="flex flex-col gap-0.5">
              <div className="text-black text-[16px] font-medium leading-tight">
                나송
              </div>
              <div className="text-black/60 text-[12px] font-light leading-tight">
                받은 요청 {post.proposalCount ?? 0}개
              </div>
            </div>
          </div>
          <Badge
            variant="outlineGray"
            className="!bg-gray-200 !border-neutral-400 !text-zinc-900 !rounded-lg shrink-0"
          >
            {STATUS_LABEL[post.status] ?? post.status}
          </Badge>
        </div>

        {/* 버릴 과목 수정 불가 경고 */}
        <div className="flex items-start gap-2 bg-amber-50 -mx-4 px-4 py-3 mb-6">
          <Icon
            icon="mdi:alert-outline"
            className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"
          />
          <p className="text-amber-700 text-xs leading-5">
            <span className="font-semibold">버릴 과목</span>은 수정할 수
            없습니다. 잘못 입력한 경우 게시글을 삭제 후 재작성해 주세요.
          </p>
        </div>
        <div className="px-4">
          {/* 버릴 과목 (읽기 전용) */}
          <section className="mb-9">
            <h2 className="text-point-red text-[15px] font-bold mb-1">
              버릴 과목
            </h2>
            <CourseCard
              title={post.discardCourse.name}
              professor={post.discardCourse.professor}
              time={post.discardCourse.classTime}
              className="!bg-[#FFF0F0] !border-0 outline outline-[0.25px] outline-offset-[-0.25px] !outline-gray-200 !rounded-xl"
              leftNode={
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <div className="size-6 bg-rose-200 rounded-full" />
                  <img
                    src={throwArrow}
                    alt="throw"
                    className="absolute size-6"
                  />
                </div>
              }
              badges={
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant="lightRed"
                    className="!border !border-neutral-400 !text-zinc-900 !font-normal !rounded-lg"
                  >
                    {post.discardCourse.courseType}
                  </Badge>
                  {post.discardCourse.department && (
                    <Badge
                      variant="lightRed"
                      className="!border !border-neutral-400 !text-zinc-900 !font-normal !rounded-lg"
                    >
                      {post.discardCourse.department}
                    </Badge>
                  )}
                </div>
              }
            />
          </section>

          {/* 원하는 과목 (수정 가능) */}
          <section className="mt-4 mb-10">
            <div className="mb-4 flex flex-col gap-1">
              <h2 className="text-brand-lightBlue text-[15px] font-bold">
                원하는 과목
              </h2>
              <p className="text-gray-400 text-[11px] font-normal">
                최소 1개 이상 선택해주세요
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {[0, 1, 2].map((index) => {
                const course = wantedCourses[index];
                return (
                  <div key={index}>
                    <div className="text-gray-800 text-[13px] font-medium mb-1.5">
                      {index + 1}순위
                    </div>

                    {course ? (
                      <CourseCard
                        title={course.name}
                        professor={course.professor}
                        time={course.classTime}
                        className="!bg-[#F4F8FB] !border-0 outline outline-[0.25px] outline-offset-[-0.25px] !outline-gray-200 !rounded-xl"
                        leftNode={
                          <div className="relative w-7 h-7 flex items-center justify-center">
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
                            className="text-gray-400"
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
        </div>
      </div>

      {/* 하단 고정 영역: 매칭 팁 문구 + 수정 완료하기 버튼 (SpecificPostsPage.tsx와 동일한
          sticky 패턴 — fixed + left-0/right-0는 모바일 프레임이 아니라 브라우저 전체 너비를
          기준으로 퍼져버리는 버그가 있어서 sticky로 맞춤) */}
      <div className="sticky bottom-0 left-0 right-0 z-10 pointer-events-none mt-auto">
        <div className="bg-gradient-to-t from-neutral-50 via-neutral-50/90 to-transparent px-4 pb-6 pt-5 pointer-events-auto">
          <div className="w-full text-center mb-8">
            <span className="text-cyan-900 text-base font-bold font-['Pretendard'] leading-5 tracking-tight">
              상대방의 1순위 과목을{' '}
            </span>
            <span className="text-cyan-900 text-sm font-normal font-['Pretendard'] leading-5 tracking-tight">
              교환 요청 시 <br />
              매칭 성공률이 올라가요!
            </span>
          </div>
          <button
            onClick={handleSubmitEdit}
            disabled={!canSubmit || submitMutation.isPending}
            className={`w-full h-14 text-white text-lg font-semibold tracking-wide transition-all ${
              canSubmit
                ? 'bg-brand-lightBlue rounded-2xl hover:opacity-90 cursor-pointer'
                : 'bg-zinc-400 rounded-md shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] cursor-not-allowed'
            } ${submitMutation.isPending ? 'opacity-60' : ''}`}
          >
            {submitMutation.isPending ? '수정 중...' : '수정 완료하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostEditPage;
