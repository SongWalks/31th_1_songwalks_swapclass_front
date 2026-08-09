import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@iconify/react';
import { ICONS } from '@/constants/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { Toast } from '@/components/common/Toast';
import axiosInstance from '@/api/axiosInstance';

// API Response 데이터 타입 정의 (명세서 기준)
interface CourseDetail {
  name: string;
  courseType?: string; // 예: '교양필수' | '전공필수' 등
  code?: string;
  category?: string;
  department?: string;
}

interface GraduationCourse {
  id: number;
  course: CourseDetail;
  completed: boolean;
}

interface PendingCourse {
  courseId: number;
  name: string;
  courseType?: string;
  code?: string;
  category?: string;
  department?: string;
}

// 💡 GET /api/me/graduation-courses 응답의 courses 배열 항목 (raw, 평평한 구조)
interface RawGraduationCourse {
  courseId: number;
  courseName: string;
  courseType?: string;
  code?: string;
  category?: string;
  department?: string;
  completed: boolean;
}

// 💡 백엔드가 에러 응답 body로 주는 형태 (409 등에서 message 필드 사용)
interface ApiErrorResponse {
  message?: string;
}

const getCourseTypeBadgeVariant = (courseType: string) => {
  if (courseType === '교양선택' || courseType === '교양필수') {
    return 'lightBlueOutline' as const;
  }
  if (courseType === '전공선택' || courseType === '전공필수') {
    return 'lightYellow' as const;
  }
  return 'outlineBlue' as const;
};

const GraduationPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 💡 검색어 디바운스: setTimeout '콜백' 안에서 setState 하는 거라 안전한 패턴
  // (React 문서가 권장하는 "외부 시스템 콜백에서 setState" 방식) — set-state-in-effect 대상 아님
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 💡 React Query로 데이터 페칭: useEffect + setState 없이 훅이 로딩/데이터 상태를 알아서 관리함
  const { data: registeredCourses = [], isLoading: loading } = useQuery({
    queryKey: ['graduationCourses', debouncedQuery],
    queryFn: async (): Promise<GraduationCourse[]> => {
      const response = await axiosInstance.get('/api/me/graduation-courses', {
        params: debouncedQuery ? { q: debouncedQuery } : {},
      });
      const raw: RawGraduationCourse[] = response.data?.data?.courses || [];
      return raw.map((c) => ({
        id: c.courseId,
        course: {
          name: c.courseName,
          courseType: c.courseType,
          code: c.code,
          category: c.category,
          department: c.department,
        },
        completed: c.completed,
      }));
    },
  });

  // 💡 "저장 전" 미리보기: sessionStorage를 useState의 초기값 계산 함수 안에서 읽음.
  // 이러면 useEffect 없이 첫 렌더 시점에 딱 한 번만 동기적으로 읽는 게 되어서,
  // "effect 안에서 setState 호출"이라는 상황 자체가 아예 생기지 않음.
  const [pendingCourse, setPendingCourse] = useState<PendingCourse | null>(
    () => {
      const raw = sessionStorage.getItem('selectedCourse');
      if (!raw) return null;

      try {
        const selected = JSON.parse(raw);
        return {
          courseId: selected.courseId,
          name: selected.name ?? selected.title,
          courseType: selected.courseType,
          code: selected.code,
          category: selected.category,
          department: selected.department,
        };
      } catch (error) {
        console.error('선택한 과목 정보를 읽지 못했습니다.', error);
        return null;
      }
    },
  );

  // 💡 한 번 읽었으니 새로고침/뒤로가기 시 중복 반영되지 않도록 비워둠.
  // setState를 전혀 호출하지 않는 effect라 set-state-in-effect 규칙 대상이 아님.
  useEffect(() => {
    sessionStorage.removeItem('selectedCourse');
  }, []);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 💡 저장 안 하고 미리보기 카드만 취소 (아직 서버에 저장 전이라 API 호출 없이 그냥 지움)
  const handleCancelPending = () => setPendingCourse(null);

  // 💡 "저장하기" 버튼을 눌렀을 때만 실제로 등록 API 호출
  const saveMutation = useMutation({
    mutationFn: async (course: PendingCourse) => {
      // TODO: 정확한 요청 body 스키마 확인 전까지 { courseId }로 가정
      await axiosInstance.post('/api/me/graduation-courses', {
        courseId: course.courseId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graduationCourses'] });
      setToastMessage('저장되었습니다.');
      setShowToast(true);
      setPendingCourse(null);
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      console.error('졸업 요건 과목 등록 실패:', error);
      if (error.response?.status === 409) {
        alert('이미 등록된 과목입니다.');
      } else {
        alert(
          error.response?.data?.message || '과목 등록 중 오류가 발생했습니다.',
        );
      }
      setPendingCourse(null);
    },
  });

  const handleSaveCourse = useCallback(() => {
    if (!pendingCourse || saveMutation.isPending) return;

    // 💡 학수번호(code)가 같으면 분반(교수/시간)이 달라도 같은 과목으로 취급 —
    // 이미 등록된 과목이랑 code가 같으면 서버 호출 없이 바로 막음
    if (
      pendingCourse.code &&
      registeredCourses.some(
        (item) => item.course.code && item.course.code === pendingCourse.code,
      )
    ) {
      alert('이미 등록된 과목(다른 분반)입니다.');
      setPendingCourse(null);
      return;
    }

    saveMutation.mutate(pendingCourse);
  }, [pendingCourse, saveMutation, registeredCourses]);

  const deleteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await axiosInstance.delete(`/api/me/graduation-courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['graduationCourses'] });
    },
    onError: (error) => {
      console.error('졸업요건 과목 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    },
  });

  const handleDeleteCourse = useCallback(
    (courseId: number) => {
      if (!window.confirm('이 과목을 졸업요건에서 삭제하시겠습니까?')) return;
      deleteMutation.mutate(courseId);
    },
    [deleteMutation],
  );

  return (
    <div className="w-full min-h-screen bg-[#FBFBFB] flex flex-col font-['Pretendard']">
      {/* 1. 상단 헤더 */}
      <div className="sticky top-0 z-40 bg-[#FBFBFB]">
        <div className="[&>header]:!border-none">
          <Header
            leftNode={
              <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
            }
            title={<div>졸업 요건 과목 등록</div>}
            rightNode={
              <button
                onClick={() => navigate('modify')}
                className="w-7 h-7 flex items-center justify-center text-black/40 hover:opacity-80 active:scale-95 transition-all"
              >
                <Icon
                  icon="mdi:pencil-outline"
                  className="size-5 text-neutral-500"
                />
              </button>
            }
          />
        </div>
      </div>

      {/* 2. 검색 인풋 */}
      <div className="px-5 pt-4 pb-2 bg-[#FBFBFB]">
        <div className="w-full h-11 bg-white rounded-3xl border border-gray-200 px-5 flex items-center justify-between">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력해주세요"
            className="flex-1 bg-transparent border-none outline-none text-sm font-light text-black placeholder-neutral-400 leading-5 tracking-wide"
          />
          <Icon
            icon={ICONS.SEARCH}
            className="w-[18px] h-[18px] text-gray-400 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. 등록된 과목 개수 */}
      <div className="px-5 pt-3 pb-1 flex items-center justify-between">
        <div className="text-sm font-light leading-5 ">
          <span className="text-zinc-900">등록된 과목 </span>
          <span className="text-blue-400">{registeredCourses.length}</span>
        </div>
      </div>

      {/* 4. 리스트 / Empty State 출력 영역 */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            목록을 불러오는 중입니다...
          </div>
        ) : registeredCourses.length === 0 && !pendingCourse ? (
          <EmptyState
            icon={<Icon icon={ICONS.WARNING} className="w-9 h-9 select-none" />}
            title="아직 등록된 졸업요건 과목이 없습니다."
            description={`졸업에 필요한 과목을 등록하고\n교환할 강의를 더 쉽게 찾아보세요.`}
            className="min-h-[50vh] justify-center"
          />
        ) : (
          <div className="flex flex-col gap-3 pb-10">
            {pendingCourse && (
              <CourseCard
                key="pending"
                title={
                  <span className="text-zinc-900 text-base font-semibold leading-6 tracking-tight">
                    {pendingCourse.name}
                  </span>
                }
                badges={(() => {
                  const label =
                    pendingCourse.category || pendingCourse.courseType;
                  const showTypeBadge = label && label !== '학과전공';
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {showTypeBadge && (
                        <Badge
                          variant={getCourseTypeBadgeVariant(label)}
                          className="!font-normal"
                        >
                          {label}
                        </Badge>
                      )}
                      {pendingCourse.department && (
                        <Badge variant="grayOutline" className="!font-normal">
                          {pendingCourse.department}
                        </Badge>
                      )}
                    </div>
                  );
                })()}
                className="!border-dashed !border-brand-lightBlue !bg-sky-50/50"
                rightNode={
                  <div className="flex items-center gap-2 -mt-1">
                    <Badge variant="outlineBlue">저장 전</Badge>
                    <IconButton
                      icon={ICONS.CLOSE}
                      onClick={handleCancelPending}
                      className="!p-1 text-neutral-400 hover:text-rose-500"
                    />
                  </div>
                }
              />
            )}
            {registeredCourses.map((item) => (
              <CourseCard
                key={item.id}
                title={
                  <span className="text-zinc-900 text-base font-semibold leading-6 tracking-tight">
                    {item.course.name}
                  </span>
                }

                badges={(() => {
                  const label = item.course.category || item.course.courseType;
                  const showTypeBadge = label && label !== '학과전공';
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      {showTypeBadge && (
                        <Badge
                          variant={getCourseTypeBadgeVariant(label)}
                          className="!font-normal"
                        >
                          {label}
                        </Badge>
                      )}
                      {item.course.department && (
                        <Badge variant="grayOutline" className="!font-normal">
                          {item.course.department}
                        </Badge>
                      )}
                    </div>
                  );
                })()}
                className={item.completed ? '!bg-neutral-50' : ''}
                // 💡 이수완료 체크는 별도 페이지에서 하기로 해서 여기선 클릭 이벤트 없이 상태만 보여줘요.
                // 미이수(completed === false)면 뱃지 자체를 아예 안 띄워요.
                rightNode={
                  <div className="flex items-center gap-2 -mt-1">
                    {item.completed && (
                      <Badge variant="primary">이수완료</Badge>
                    )}
                    <IconButton
                      icon={ICONS.CLOSE}
                      onClick={() => handleDeleteCourse(item.id)}
                      className="!p-1 text-neutral-400 hover:text-rose-500"
                    />
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. 하단 안내 문구 + 버튼 */}
      <div className="sticky bottom-0 z-40 px-5 pb-6 pt-4 bg-[#FBFBFB] border-t border-gray-100">
        <p className="text-center text-cyan-900 text-base font-bold font-['Pretendard'] leading-5 tracking-tight mb-7">
          등록한 과목은 과목 검색 시 가장 먼저 표시됩니다
        </p>
        <button
          onClick={() =>
            pendingCourse ? handleSaveCourse() : navigate('/course-search')
          }
          disabled={saveMutation.isPending}
          className="w-full h-14 bg-brand-lightBlue hover:opacity-90 active:scale-[0.99] disabled:opacity-60 transition-all rounded-md text-white text-lg font-semibold font-['Pretendard'] leading-5 tracking-tight"
        >
          {saveMutation.isPending
            ? '저장 중...'
            : pendingCourse
              ? '저장하기'
              : '과목 추가하기'}
        </button>
      </div>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={2000}
      />
    </div>
  );
};

export default GraduationPage;
