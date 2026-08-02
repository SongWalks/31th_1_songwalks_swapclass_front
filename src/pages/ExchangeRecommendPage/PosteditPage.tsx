import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const PostEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();

  const [post, setPost] = useState<PostDetailResponse | null>(null);
  const [receivedRequestCount, setReceivedRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wantedCourses, setWantedCourses] = useState<
    (CourseSelection | null)[]
  >([null, null, null]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingWantedCoursesRef = useRef<(CourseSelection | null)[] | null>(
    null,
  );

  const applyPostData = (data: PostDetailResponse) => {
    setPost(data);

    if (pendingWantedCoursesRef.current) {
      // 방금 과목 검색에서 돌아온 거면, 서버의 예전 값 대신 방금 고른 값을 그대로 유지
      setWantedCourses(pendingWantedCoursesRef.current);
      pendingWantedCoursesRef.current = null;
      return;
    }

    const sorted = [...data.wantedCourses].sort(
      (a, b) => a.priority - b.priority,
    );
    setWantedCourses(
      [0, 1, 2].map((i) => {
        const item = sorted[i];
        return item ? toCourseSelection(item.course) : null;
      }),
    );
  };

  const fetchPost = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/posts/${postId}`);
      if (response.data?.success) {
        applyPostData(response.data.data as PostDetailResponse);
      }
    } catch (error) {
      console.error('게시글 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);
  const hasFetchedPostRef = useRef(false);

  useEffect(() => {
    if (hasFetchedPostRef.current) return;
    hasFetchedPostRef.current = true;
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
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

    if (restoredWanted) {
      pendingWantedCoursesRef.current = restoredWanted;
      setWantedCourses(restoredWanted);
    }

    sessionStorage.removeItem('postEditFormState');
    sessionStorage.removeItem('selectedCourse');
    sessionStorage.removeItem('courseSearchTarget');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchReceivedRequestCount = async () => {
      try {
        const response = await axiosInstance.get('/api/proposals/received');
        const received = response.data?.data || [];
        setReceivedRequestCount(received.length);
      } catch (error) {
        console.error('받은 요청 개수 조회 실패:', error);
      }
    };

    fetchReceivedRequestCount();
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
    setWantedCourses((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const canSubmit = wantedCourses.some((course) => course !== null);

  const handleSubmitEdit = async () => {
    if (!canSubmit || !postId || isSubmitting) return;

    // TODO: PATCH /api/posts/{postId} 실제 요청 스키마 확인되면 그에 맞춰 수정
    const wantedCourseIds = wantedCourses
      .filter((course): course is CourseSelection => course !== null)
      .map((course) => course.courseId);

    try {
      setIsSubmitting(true);
      const response = await axiosInstance.patch(`/api/posts/${postId}`, {
        wantedCourseIds,
      });

      if (response.data?.success) {
        navigate(`/board/${postId}`, { replace: true });
      }
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      alert('게시글 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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
            <span className="text-black/70 text-[17px] font-semibold pointer-events-auto">
              게시글 상세
            </span>
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
                {post.authorNickname}
              </div>
              <div className="text-black/60 text-[12px] font-light leading-tight">
                받은 요청 {receivedRequestCount}개
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

        {/* 버릴 과목 (읽기 전용) */}
        <section className="mb-9">
          <h2 className="text-point-red text-base font-bold mb-3 tracking-wide">
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
                <img src={throwArrow} alt="throw" className="absolute size-6" />
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
        <section className="mb-6">
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

      {/* 하단 고정 영역: 매칭 팁 문구 + 수정 완료하기 버튼 (둘이 함께 고정) */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-5 bg-gradient-to-t from-neutral-50 via-neutral-50/90 to-transparent">
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
          disabled={!canSubmit || isSubmitting}
          className={`w-full h-14 text-white text-lg font-semibold tracking-wide transition-all ${
            canSubmit
              ? 'bg-brand-lightBlue rounded-2xl hover:opacity-90 cursor-pointer'
              : 'bg-zinc-400 rounded-md shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] cursor-not-allowed'
          } ${isSubmitting ? 'opacity-60' : ''}`}
        >
          {isSubmitting ? '수정 중...' : '수정 완료하기'}
        </button>
      </div>
    </div>
  );
};

export default PostEditPage;
