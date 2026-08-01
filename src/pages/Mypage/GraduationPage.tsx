import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@iconify/react';
import { ICONS } from '@/constants/icons';
import { EmptyState } from '@/components/common/EmptyState';
import { Toast } from '@/components/common/Toast';
import axiosInstance from '@/api/axiosInstance'; // 💡 프로젝트의 Axios 인스턴스 경로로 맞춰주세요!

// API Response 데이터 타입 정의 (명세서 기준)
interface CourseDetail {
  name: string;
  courseType?: string; // 예: '교양필수' | '전공필수' 등
  code?: string;
  // 💡 category: '학과전공'처럼 뭉뚱그려진 courseType 대신, '교양선택' 등 세부 분류가 담긴 필드.
  // department와 함께 /api/me/graduation-courses 응답엔 아직 없어서(백엔드 추가 요청함) 대부분 undefined일 것.
  category?: string;
  department?: string;
}

interface GraduationCourse {
  id: number;
  course: CourseDetail;
  completed: boolean;
}

// 💡 저장 전 미리보기용: CourseSearchPage가 넘겨주는 selectedCourse에서 필요한 정보만
interface PendingCourse {
  courseId: number;
  name: string;
  courseType?: string;
  code?: string;
  category?: string;
  department?: string;
}

// 💡 과목유형별 뱃지 색상: 교양(선택/필수)=하늘색 아웃라인, 전공(선택/필수)=노란색, 그 외=파란 아웃라인
// (CourseSearchPage.tsx랑 동일한 규칙. '학과전공'처럼 뭉뚱그려진 값은 아예 안 보여줌)
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
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredCourses, setRegisteredCourses] = useState<
    GraduationCourse[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. 내가 등록한 졸업 요건 과목 목록 조회 API
  const fetchGraduationCourses = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/me/graduation-courses', {
        params: query ? { q: query } : {},
      });
      if (response.data?.success) {
        // 💡 실제 API 응답은 course: {...}로 중첩돼있지 않고 평평한 구조라 화면이 기대하는
        // 형태로 매핑해줌. courseType/code/category는 백엔드에 추가 요청해둔 필드라 아직 안 오면 undefined.
        const mapped: GraduationCourse[] = (
          response.data.data.courses || []
        ).map((c: any) => ({
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
        setRegisteredCourses(mapped);
      }
    } catch (error) {
      console.error('졸업 요건 과목 목록 조회 실패:', error);
    } finally {
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

  // 💡 버튼 눌러야 실제로 저장되게 구조 변경: 과목 검색에서 돌아오면 바로 등록 API를 부르지 않고,
  // "저장 대기 중"인 과목 정보만 들고 있다가, "저장하기" 버튼을 눌렀을 때 그때 등록함
  const [pendingCourse, setPendingCourse] = useState<PendingCourse | null>(
    null,
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 💡 CourseSearchPage(/search)에서 과목 선택하고 돌아왔을 때, 일단 "저장 대기" 상태로만 둠
  // (name/courseType까지 같이 받아서 저장 전에도 리스트에 미리 보여줄 수 있게 함)
  useEffect(() => {
    const state = location.state as {
      selectedCourse?: {
        courseId: number;
        name: string;
        courseType?: string;
        code?: string;
        category?: string;
        department?: string;
      };
    } | null;
    if (!state?.selectedCourse) return;

    setPendingCourse({
      courseId: state.selectedCourse.courseId,
      name: state.selectedCourse.name,
      courseType: state.selectedCourse.courseType,
      code: state.selectedCourse.code,
      category: state.selectedCourse.category,
      department: state.selectedCourse.department,
    });

    // 새로고침/뒤로가기 시 같은 값이 중복 반영되지 않도록 state 비우기
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // 💡 저장 안 하고 미리보기 카드만 취소 (아직 서버에 저장 전이라 API 호출 없이 그냥 지움)
  const handleCancelPending = () => setPendingCourse(null);

  // 💡 "저장하기" 버튼을 눌렀을 때만 실제로 등록 API 호출
  const handleSaveCourse = useCallback(async () => {
    if (!pendingCourse || isRegistering) return;

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

  // 💡 졸업요건 과목 삭제. item.id는 위 매핑에서 c.courseId로 채워져 있어서
  // DELETE 엔드포인트의 {courseId} 경로 파라미터에 그대로 사용 가능
  const handleDeleteCourse = useCallback(
    async (courseId: number) => {
      if (!window.confirm('이 과목을 졸업요건에서 삭제하시겠습니까?')) return;
      try {
        await axiosInstance.delete(`/api/me/graduation-courses/${courseId}`);
        // 삭제 성공하면 목록 새로고침 (과목 검색 화면의 "졸업요건" 표시는
        // 백엔드가 isGraduationReq를 등록 상태 기준으로 다시 계산해줄 거라
        // 별도 프론트 작업 없이 다음 조회부터 자동으로 반영될 것으로 예상)
        fetchGraduationCourses(searchQuery);
      } catch (error) {
        console.error('졸업요건 과목 삭제 실패:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    },
    [fetchGraduationCourses, searchQuery],
  );

  // 2. 이수 완료 토글은 별도 페이지에서 처리하기로 해서 이 화면에선 관련 이벤트를 지웠어요.
  // (해당 페이지 만들 때 아래 형태로 axiosInstance.patch(`/graduation/courses/${courseId}/complete`) 호출하면 돼요.)

  // 3. 등록된 졸업 요건 과목 삭제 API
  // 💡 이 화면에선 삭제 버튼을 없앴다고 하셔서 handleDeleteCourse는 지웠어요.
  // 나중에 다시 필요해지면 위 handleToggleComplete 옆에 axiosInstance.delete(`/graduation/courses/${courseId}`) 형태로 추가하시면 돼요.

  return (
    <div className="w-full min-h-screen bg-[#FBFBFB] flex flex-col font-['Pretendard']">
      {/* 1. 상단 헤더 */}
      <div className="sticky top-0 z-40 bg-[#FBFBFB]">
        <div className="[&>header]:!border-none">
          <Header
            leftNode={
              <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
            }
            title={
              <div className="whitespace-nowrap transform text-black/70 text-xl font-semibold leading-5 tracking-wide">
                졸업 요건 과목 등록
              </div>
            }
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
            pendingCourse
              ? handleSaveCourse()
              : navigate('/course-search', {
                  state: { returnPath: '/my/graduation' },
                })
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
