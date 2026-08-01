import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { IconButton } from '@/components/common/IconButton';
import { Dropdown } from '@/components/common/Dropdown';
import { Badge } from '@/components/common/Badge';
import { ICONS } from '@/constants/icons';
import axiosInstance from '@/api/axiosInstance';

interface CourseListItem {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  courseType: string; // '교양필수' | '전공필수' 등
  department: string;
  category: string;
  area: string;
  isGraduationReq: boolean;
  myGraduationCourse: boolean;
  code?: string;
}

// 💡 PostWritePage로 왕복할 때 실제로 필요한 필드만 담는 가벼운 타입
// (CourseListItem 전체가 아니라 이 필드들만 있으면 됨)
// 💡 code(학수번호) 추가: GraduationPage에서 "다른 분반이지만 같은 과목"인지 비교하는 데 씀
interface CourseSelection {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
  code?: string;
}

// 💡 과목유형(category)과 학과/영역(department) 둘 다 이제 실제 API에서 받아옴
// (예전엔 하드코딩된 목업 값이라 실제 데이터랑 안 맞았음)
interface DepartmentOption {
  type: string;
  value: string;
}

const CourseSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 💡 호출한 페이지에서 navigate(state)로 넘겨준 "돌아갈 경로" + "어느 슬롯을 채울지" + "지금까지의 전체 선택 상태"
  const {
    returnPath,
    target,
    priority,
    discardCourse: incomingDiscardCourse,
    wantedCourses: incomingWantedCourses,
  } = (location.state as {
    returnPath?: string;
    target?: 'discard' | 'wanted';
    priority?: number;
    discardCourse?: CourseSelection | null;
    wantedCourses?: (CourseSelection | null)[];
  }) || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  // 💡 department state는 이제 'ALL' 이거나 "type:value" 형태의 합성 키를 가짐
  // (department 파라미터로 보낼지 area 파라미터로 보낼지, type 보고 구분하기 위함)
  const [department, setDepartment] = useState('ALL');
  // 💡 UI 없이 항상 false로 고정 (졸업요건 필터 UI는 사용 안 하기로 함)
  const graduationOnly = false;
  // 💡 과목유형 필터: 'ALL'이면 전체, 값 있으면 그 유형만 (학과 필터와 AND로 결합)
  const [courseTypeFilter, setCourseTypeFilter] = useState('ALL');

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 💡 필터 옵션(과목유형/학과·영역) 목록을 실제 API에서 받아옴 (한 번만)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    DepartmentOption[]
  >([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesRes, departmentsRes] = await Promise.all([
          axiosInstance.get('/api/lectures/categories'),
          axiosInstance.get('/api/lectures/departments'),
        ]);
        setCategoryOptions(categoriesRes.data?.data || []);
        setDepartmentOptions(departmentsRes.data?.data || []);
      } catch (error) {
        console.error('필터 옵션 조회 실패:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  const COURSE_TYPE_OPTIONS = [
    { value: 'ALL', label: '전체' },
    ...categoryOptions.map((c) => ({ value: c, label: c })),
  ];

  // 💡 Swagger로 확인 완료: department.type은 정확히 'DEPARTMENT' 또는 'AREA'(대문자)로 옴
  const DEPARTMENT_DROPDOWN_OPTIONS = [
    { value: 'ALL', label: '전체' },
    ...departmentOptions.map((d) => ({
      value: `${d.type}:${d.value}`,
      label: d.value,
    })),
  ];

  // 💡 검색어 + 학과·영역 + 과목유형 + 졸업요건만 보기 옵션으로 실제 API 조회 (300ms 디바운스)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        // department state는 'ALL' 또는 "type:value" 합성 키
        let departmentParam: string | undefined;
        let areaParam: string | undefined;
        if (department !== 'ALL') {
          const [type, ...rest] = department.split(':');
          const value = rest.join(':'); // 값 자체에 ':'가 섞여있을 가능성 방지
          if (type === 'AREA') {
            areaParam = value;
          } else {
            departmentParam = value;
          }
        }

        const response = await axiosInstance.get('/api/lectures', {
          params: {
            keyword: searchQuery.trim() || undefined,
            department: departmentParam,
            area: areaParam,
            category: courseTypeFilter !== 'ALL' ? courseTypeFilter : undefined,
            graduationOnly,
            page: 0,
            // 💡 페이지네이션 API라 완전히 없앨 순 없어서, 사실상 "전부 다"가 되도록 크게 잡음
            size: 1000,
          },
        });
        // 💡 응답이 GET /api/posts처럼 페이지네이션 구조(data.content)로 바뀜
        const rawCourses: CourseListItem[] = response.data?.data?.content || [];
        // 💡 isGraduationReq는 크롤링 데이터가 아직 다 false라 못 씀 (확인됨).
        // myGraduationCourse(내가 등록한 졸업요건 과목)가 실제로 값이 오고 있어서 이걸로 정렬
        const sortedCourses = [...rawCourses].sort(
          (a, b) => Number(b.myGraduationCourse) - Number(a.myGraduationCourse),
        );
        setCourses(sortedCourses);
      } catch (error) {
        console.error('과목 검색 실패:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, department, courseTypeFilter, graduationOnly]);

  const handleSelectCourse = (course: CourseListItem) => {
    const selectedCourse = {
      courseId: course.courseId,
      name: course.name,
      professor: course.professor,
      classTime: course.classTime,
      department: course.department,
      courseType: course.courseType,
      code: course.code,
    };

    // 💡 기존에 선택돼있던 전체 상태에 이번에 고른 과목만 끼워넣어서 되돌려줌
    let updatedDiscardCourse = incomingDiscardCourse ?? null;
    const updatedWantedCourses = [
      ...(incomingWantedCourses ?? [null, null, null]),
    ];

    if (target === 'discard') {
      updatedDiscardCourse = selectedCourse;
    } else if (target === 'wanted' && typeof priority === 'number') {
      updatedWantedCourses[priority] = selectedCourse;
    }

    // 💡 호출한 페이지가 넘겨준 returnPath로 돌아감 (안 넘겼으면 예전처럼 /board/write로 기본 처리)
    // selectedCourse는 discard/wanted 슬롯 개념이 없는 페이지(예: GraduationPage)를 위해 항상 같이 실어보냄
    navigate(returnPath || '/board/write', {
      state: {
        selectedCourse,
        discardCourse: updatedDiscardCourse,
        wantedCourses: updatedWantedCourses,
      },
      replace: true,
    });
  };

  // 💡 과목유형별 뱃지 색상: 교양(선택/필수)=하늘색 아웃라인, 전공(선택/필수)=노란색, 그 외=파란 아웃라인
  const getCourseTypeBadgeVariant = (courseType: string) => {
    if (courseType === '교양선택' || courseType === '교양필수') {
      return 'lightBlueOutline' as const;
    }
    if (courseType === '전공선택' || courseType === '전공필수') {
      return 'lightYellow' as const;
    }
    return 'outlineBlue' as const;
  };

  // 💡 이제 courseType(category) 필터는 서버에서 처리하므로, 받아온 결과를 그대로 씀
  const displayedCourses = courses;

  return (
    <div className="relative w-full min-h-screen bg-neutral-50 flex flex-col font-['Pretendard']">
      {/* 헤더: 뒤로가기 + 검색 인풋 + 필터 토글 */}
      <div className="sticky mt-1 top-0 z-40 bg-neutral-50">
        <div className="px-2 pt-4 pb-3 flex items-center gap-3">
          <IconButton
            icon={ICONS.BACK}
            onClick={() => navigate(-1)}
            className="text-black/40 shrink-0"
          />
          <div className="flex-1 h-9 bg-white rounded-3xl border border-gray-200 px-4 flex items-center justify-between">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색어를 입력해주세요"
              className="flex-1 bg-transparent border-none outline-none text-sm font-light text-black placeholder-neutral-400 leading-5 tracking-wide"
            />
            <Icon
              icon={ICONS.SEARCH}
              className="w-4 h-4 text-neutral-400 cursor-pointer shrink-0"
            />
          </div>
        </div>

        <div className="px-5 pb-3 mt-2">
          <button
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="text-brand-lightBlue text-base font-bold tracking-wide"
          >
            {isFilterOpen ? '필터 닫기' : '필터 열기'}
          </button>
        </div>

        {isFilterOpen && (
          <div className="mx-4 mb-5 p-5 bg-slate-50 rounded-lg border-[0.5px] border-brand-lightBlue flex flex-col gap-3">
            <div>
              <p className="text-zinc-900 text-xs font-medium mb-1.5 tracking-wide">
                과목유형
              </p>
              <Dropdown
                options={COURSE_TYPE_OPTIONS}
                value={courseTypeFilter}
                onChange={setCourseTypeFilter}
                className="[&>div:last-child]:!max-h-64 [&>div:last-child]:!overflow-y-auto"
              />
            </div>
            <div>
              <p className="text-zinc-900 text-xs font-medium mb-1.5 tracking-wide">
                학과/영역
              </p>
              <Dropdown
                options={DEPARTMENT_DROPDOWN_OPTIONS}
                value={department}
                onChange={setDepartment}
                className="[&>div:last-child]:!max-h-64 [&>div:last-child]:!overflow-y-auto"
              />
            </div>
          </div>
        )}

        <div className="w-full border-b border-gray-200 mb-4" />
      </div>

      {/* 검색 결과 리스트 */}
      <div className="flex-1 px-4 pt-2 pb-20">
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-10">
            검색 중입니다...
          </div>
        ) : displayedCourses.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-10">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedCourses.map((course) => {
              return (
                <button
                  key={course.courseId}
                  onClick={() => handleSelectCourse(course)}
                  className="relative w-full text-left bg-white rounded-lg border border-zinc-400 p-4 hover:bg-gray-50 transition-colors"
                >
                  {course.myGraduationCourse && (
                    <Badge
                      variant="bluesolid"
                      className="!absolute !top-3 !right-3 !rounded-lg !font-light !border-brand-lightBlue"
                    >
                      졸업요건
                    </Badge>
                  )}

                  <h3 className="text-zinc-900 text-base font-semibold leading-6 tracking-tight">
                    {course.name}
                  </h3>
                  <p className="text-neutral-500 text-sm font-normal leading-5 tracking-wide mt-0.5">
                    {course.professor} · {course.classTime}
                  </p>

                  <div className="flex gap-2 mt-3">
                    {course.category !== '학과전공' && (
                      <Badge
                        variant={getCourseTypeBadgeVariant(course.category)}
                        className="!rounded-lg !font-normal"
                      >
                        {course.category}
                      </Badge>
                    )}
                    {course.department && (
                      <Badge variant="grayOutline" className="!font-normal">
                        {course.department}
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 안내 배너 */}
      <div className="sticky bottom-0 bg-blue-100 py-3 px-4 text-center">
        <p className="text-cyan-900 text-sm font-normal tracking-tight">
          졸업 요건에 해당하는 과목이 상단에 표시됩니다
        </p>
      </div>
    </div>
  );
};

export default CourseSearchPage;
