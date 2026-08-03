import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import { Toast } from '@/components/common/Toast';
import { EmptyState } from '@/components/common/EmptyState';
import { ICONS } from '@/constants/icons';
import axiosInstance from '@/api/axiosInstance';

interface CourseItem {
  id: number;
  name: string;
  courseType?: string;
  category?: string;
  department?: string;
  completed: boolean;
}

// 💡 GET /api/me/graduation-courses 응답의 courses 배열 항목 (raw)
interface RawGraduationCourse {
  courseId: number;
  courseName: string;
  courseType?: string;
  category?: string;
  department?: string;
  completed: boolean;
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

const GraduationAddPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 💡 React Query로 데이터 페칭: useEffect + setState 없이 훅 자체가 로딩/에러/데이터 상태를 관리함
  const { data: courses = [], isLoading: loading } = useQuery({
    queryKey: ['graduationCourses'],
    queryFn: async (): Promise<CourseItem[]> => {
      const response = await axiosInstance.get('/api/me/graduation-courses');
      const raw: RawGraduationCourse[] = response.data?.data?.courses || [];
      return raw.map((c) => ({
        id: c.courseId,
        name: c.courseName,
        courseType: c.courseType,
        category: c.category,
        department: c.department,
        completed: c.completed,
      }));
    },
  });

  // 💡 "선택 상태"를 별도 state에 fetch 결과로부터 seed하는 대신(그러면 또 effect+setState가
  // 필요해짐), "기본값(course.completed)에서 벗어난 것만" overrides에 기록하는 방식으로 처리.
  // 체크 여부 = overrides에 있으면 그 값, 없으면 그냥 course.completed 그대로.
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});

  const isSelected = (course: CourseItem) =>
    overrides[course.id] ?? course.completed;

  const toggleSelect = (id: number) => {
    setOverrides((prev) => {
      const course = courses.find((c) => c.id === id);
      const current = prev[id] ?? course?.completed ?? false;
      return { ...prev, [id]: !current };
    });
  };

  const isAllSelected =
    courses.length > 0 && courses.every((c) => isSelected(c));

  const toggleSelectAll = () => {
    const next: Record<number, boolean> = {};
    courses.forEach((c) => {
      next[c.id] = !isAllSelected;
    });
    setOverrides((prev) => ({ ...prev, ...next }));
  };

  const hasChanges = courses.some((c) => isSelected(c) !== c.completed);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [navigateOnToastClose, setNavigateOnToastClose] = useState(false);

  const handleToastClose = () => {
    setShowToast(false);
    if (navigateOnToastClose) {
      navigate('/my/graduation');
    }
  };

  // 💡 실제 API는 "일괄 설정"이 아니라 "과목 하나당 완료↔미완료 토글"이라(PATCH /{courseId}),
  // 선택 상태가 실제 completed 값과 달라진 과목만 골라서 토글함
  const submitMutation = useMutation({
    mutationFn: async () => {
      const toToggle = courses.filter((c) => isSelected(c) !== c.completed);
      await Promise.all(
        toToggle.map((c) =>
          axiosInstance.patch(`/api/me/graduation-courses/${c.id}`),
        ),
      );
    },
    onSuccess: () => {
      // 서버 최신 상태로 다시 받아오기
      queryClient.invalidateQueries({ queryKey: ['graduationCourses'] });
      setOverrides({});
      setToastMessage('저장되었습니다.');
      setNavigateOnToastClose(true);
      setShowToast(true);
    },
    onError: (error) => {
      console.error('이수완료 설정 실패:', error);
      setToastMessage('설정 중 오류가 발생했습니다.');
      setNavigateOnToastClose(false);
      setShowToast(true);
    },
  });

  const handleSubmit = () => {
    if (submitMutation.isPending) return;

    const toToggle = courses.filter((c) => isSelected(c) !== c.completed);
    if (toToggle.length === 0) {
      navigate('/my/graduation');
      return;
    }

    submitMutation.mutate();
  };

  return (
    <div className="relative w-full h-screen bg-neutral-50 flex flex-col font-['Pretendard'] overflow-hidden">
      {/* 1. 상단 헤더 */}
      <div className="[&>header]:!border-none">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={<div>이수완료 과목 설정하기</div>}
        />
      </div>

      {/* 2. 전체 선택 / N개 선택 카운트 */}
      {!loading && courses.length > 0 && (
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5"
          >
            <span
              className={`size-3.5 rounded-sm border flex items-center justify-center ${
                isAllSelected
                  ? 'bg-brand-lightBlue border-brand-lightBlue'
                  : 'border-zinc-400'
              }`}
            >
              {isAllSelected && (
                <Icon icon="mdi:check" className="text-white text-[9px]" />
              )}
            </span>
            <span className="text-slate-500 text-xs font-normal leading-5 tracking-wide">
              전체 선택
            </span>
          </button>
          <span className="text-slate-500 text-xs font-normal leading-5 tracking-wide">
            {courses.filter((c) => isSelected(c)).length}/{courses.length} 선택
          </span>
        </div>
      )}

      {/* 3. 리스트 / Empty / Loading */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            목록을 불러오는 중입니다...
          </div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={<Icon icon={ICONS.WARNING} className="w-9 h-9 select-none" />}
            title="등록된 졸업요건 과목이 없습니다."
            description={`먼저 졸업요건 과목을 등록한 뒤\n이수완료 여부를 설정할 수 있어요.`}
            className="min-h-[50vh] justify-center"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map((item) => {
              const selected = isSelected(item);
              return (
                <CourseCard
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={
                    selected
                      ? '!border-[1.5px] !border-brand-lightBlue'
                      : '!border !border-gray-200'
                  }
                  leftNode={
                    <span
                      className={`size-5 rounded-sm flex items-center justify-center transition-colors ${
                        selected
                          ? 'bg-brand-lightBlue'
                          : 'border-[0.5px] border-zinc-400'
                      }`}
                    >
                      {selected && (
                        <Icon icon="mdi:check" className="text-white text-sm" />
                      )}
                    </span>
                  }
                  title={
                    <span className="text-zinc-900 text-base font-semibold leading-6 tracking-tight">
                      {item.name}
                    </span>
                  }
                  badges={(() => {
                    const label = item.category || item.courseType;
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
                        {item.department && (
                          <Badge variant="grayOutline" className="!font-normal">
                            {item.department}
                          </Badge>
                        )}
                      </div>
                    );
                  })()}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 4. 하단 설정 버튼 */}
      {!loading && courses.length > 0 && (
        <div className="sticky bottom-0 w-full px-4 pb-6 pt-4 bg-neutral-50 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !hasChanges}
            className="w-full h-14 bg-brand-lightBlue disabled:opacity-40 hover:opacity-90 active:scale-[0.99] transition-all rounded-md text-white text-lg font-semibold"
          >
            저장하기
          </button>
        </div>
      )}

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleToastClose}
        duration={1000}
      />
    </div>
  );
};

export default GraduationAddPage;
