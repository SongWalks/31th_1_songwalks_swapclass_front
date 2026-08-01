import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import { Toast } from '@/components/common/Toast';
import { EmptyState } from '@/components/common/EmptyState';
import { ICONS } from '@/constants/icons';
import axiosInstance from '@/api/axiosInstance';

// 💡 professor/classTime/tags는 실제 API에 없는 필드라 목업으로 고정돼 있었음(모든 과목에
// 'John Smith' 등 동일 값이 뜨는 심각한 버그였음). GraduationPage.tsx와 동일하게
// courseType만 실제로 존재하는 값으로 쓰고, 교수/시간은 아예 표시 안 함(CourseSearchPage에서 확인).
interface CourseItem {
  id: number;
  name: string;
  courseType?: string;
  // 💡 category/department: /api/me/graduation-courses에 아직 없는 필드(백엔드 추가 요청함).
  // 오면 category가 courseType(예: '학과전공')보다 우선해서 뱃지에 쓰임.
  category?: string;
  department?: string;
  completed: boolean;
}

// 💡 이 페이지는 검색/추가가 아니라 "등록된 과목 중 이수완료로 설정할 과목을 고르는" 화면이라
// 이전의 검색창/추가 로직은 다 지우고, 체크박스 다중 선택 + 일괄 이수완료 설정으로 바꿨어요.
// 💡 과목유형별 뱃지 색상: 교양(선택/필수)=하늘색 아웃라인, 전공(선택/필수)=노란색, 그 외=파란 아웃라인
// (CourseSearchPage.tsx/GraduationPage.tsx랑 동일한 규칙)
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

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // API 1: 등록된 졸업 요건 과목 목록 불러오기
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/me/graduation-courses');
      if (response.data?.success) {
        const apiCourses: CourseItem[] = response.data.data.courses.map(
          (c: any) => ({
            id: c.courseId,
            name: c.courseName,
            courseType: c.courseType,
            category: c.category,
            department: c.department,
            completed: c.completed,
          }),
        );
        setCourses(apiCourses);
        // 이미 이수완료로 표시된 과목은 진입 시 기본으로 체크되어 있게 함
        setSelectedIds(apiCourses.filter((c) => c.completed).map((c) => c.id));
      }
    } catch (error) {
      console.error('졸업 요건 과목 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const isAllSelected =
    courses.length > 0 && selectedIds.length === courses.length;

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : courses.map((c) => c.id));
  };

  // 전체 해제(이수완료 취소)도 저장 가능해야 하므로, 선택 개수가 아니라
  // 실제 completed 상태와 달라진 과목이 있는지로 저장 가능 여부를 판단함
  const hasChanges = courses.some(
    (c) => selectedIds.includes(c.id) !== c.completed,
  );

  // 이수완료 설정 성공 시에만 토스트가 닫히고 나서 이동하도록 구분
  const [navigateOnToastClose, setNavigateOnToastClose] = useState(false);

  const handleToastClose = () => {
    setShowToast(false);
    if (navigateOnToastClose) {
      navigate('/my/graduation');
    }
  };

  // API 2: 선택 상태가 바뀐 과목만 골라서 이수완료 토글
  // 💡 실제 API는 "일괄 설정"이 아니라 "과목 하나당 완료↔미완료 토글"이라(PATCH /{courseId}),
  // 선택된 과목 전부를 무조건 부르면 이미 완료된 과목이 오히려 미완료로 풀려버림.
  // 그래서 선택 상태(selectedIds)와 실제 completed 값이 다른 과목만 토글함.
  const handleSubmit = async () => {
    if (submitting) return;

    const toToggle = courses.filter(
      (c) => selectedIds.includes(c.id) !== c.completed,
    );

    if (toToggle.length === 0) {
      navigate('/my/graduation');
      return;
    }

    try {
      setSubmitting(true);
      await Promise.all(
        toToggle.map((c) =>
          axiosInstance.patch(`/api/me/graduation-courses/${c.id}`),
        ),
      );
      setToastMessage('저장되었습니다.');
      setNavigateOnToastClose(true);
      setShowToast(true);
    } catch (error) {
      console.error('이수완료 설정 실패:', error);
      setToastMessage('설정 중 오류가 발생했습니다.');
      setNavigateOnToastClose(false);
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-neutral-50 flex flex-col font-['Pretendard'] overflow-hidden">
      {/* 1. 상단 헤더 */}
      <div className="[&>header]:!border-none">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={
            <div className="whitespace-nowrap text-black/70 text-xl font-semibold leading-5 tracking-wide">
              이수완료 과목 설정하기
            </div>
          }
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
            {selectedIds.length}/{courses.length} 선택
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
              const selected = selectedIds.includes(item.id);
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
            disabled={submitting || !hasChanges}
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
