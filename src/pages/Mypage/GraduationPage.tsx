import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredCourses, setRegisteredCourses] = useState<
    GraduationCourse[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. 내가 등록한 졸업 요건 과목 목록 조회 API
  const fetchGraduationCourses = useCallback(async (query: string) => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      const response = await axiosInstance.get('/api/me/graduation-courses', {
        params: query ? { q: query } : {},
      });
      if (response.data?.success) {
        const mapped: GraduationCourse[] = (response.data.data.courses || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => ({
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRegisteredCourses(mapped);
      }
    } catch (error) {
      console.error('졸업 요건 과목 목록 조회 실패:', error);
    } finally {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, []);

  // 검색어 입력 시 디바운스 처리 (입력 후 300ms 뒤 API 호출)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGraduationCourses(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchGraduationCourses]);

  const [pendingCourse, setPendingCourse] = useState<PendingCourse | null>(
    null,
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('selectedCourse');

    if (!raw) return;

    try {
      const selected = JSON.parse(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingCourse({
        courseId: selected.courseId,
        name: selected.name ?? selected.title,
        courseType: selected.courseType,
        code: selected.code,
        category: selected.category,
        department: selected.department,
      });
    } catch (error) {
      console.error('선택한 과목 정보를 읽지 못했습니다.', error);
    } finally {
      // 새로고침/뒤로가기 시 같은 값이 중복 반영되지 않도록 한 번 읽으면 바로 비움
      sessionStorage.removeItem('selectedCourse');
    }
  }, []);

  // 💡 저장 안 하고 미리보기 카드만 취소 (아직 서버에 저장 전이라 API 호출 없이 그냥 지움)
  const handleCancelPending = () => setPendingCourse(null);

  // 💡 "저장하기" 버튼을 눌렀을 때만 실제로 등록 API 호출
  const handleSaveCourse = useCallback(async () => {
    if (!pendingCourse || isRegistering) return;

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

    try {
      setIsRegistering(true);
      // TODO: 정확한 요청 body 스키마 확인 전까지 { courseId }로 가정
      await axiosInstance.post('/api/me/graduation-courses', {
        courseId: pendingCourse.courseId,
      });
      await fetchGraduationCourses(searchQuery); // 등록 성공하면 목록 새로고침
      setToastMessage('저장되었습니다.');
      setShowToast(true);
      setPendingCourse(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('졸업 요건 과목 등록 실패:', error);
      if (error?.response?.status === 409) {
        alert('이미 등록된 과목입니다.');
      } else {
        const serverMessage = error?.response?.data?.message;
        alert(serverMessage || '과목 등록 중 오류가 발생했습니다.');
      }
      setPendingCourse(null);
    } finally {
      setIsRegistering(false);
    }
  }, [
    pendingCourse,
    isRegistering,
    registeredCourses,
    fetchGraduationCourses,
    searchQuery,
  ]);

  const handleDeleteCourse = useCallback(
    async (courseId: number) => {
      if (!window.confirm('이 과목을 졸업요건에서 삭제하시겠습니까?')) return;
      try {
        await axiosInstance.delete(`/api/me/graduation-courses/${courseId}`);
        fetchGraduationCourses(searchQuery);
      } catch (error) {
        console.error('졸업요건 과목 삭제 실패:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    },
    [fetchGraduationCourses, searchQuery],
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
          disabled={isRegistering}
          className="w-full h-14 bg-brand-lightBlue hover:opacity-90 active:scale-[0.99] disabled:opacity-60 transition-all rounded-md text-white text-lg font-semibold font-['Pretendard'] leading-5 tracking-tight"
        >
          {isRegistering
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
