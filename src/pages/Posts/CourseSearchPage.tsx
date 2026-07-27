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
}

// 💡 PostWritePage로 왕복할 때 실제로 필요한 필드만 담는 가벼운 타입
// (CourseListItem 전체가 아니라 이 6개만 있으면 됨)
interface CourseSelection {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
}

// 💡 과목유형 필터 (교양/전공 필수·선택). 학과/영역 필터와 함께(AND) 적용됨
const COURSE_TYPE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: '교양필수', label: '교양필수' },
  { value: '교양선택', label: '교양선택' },
  { value: '전공선택', label: '전공선택' },
  { value: '전공필수', label: '전공필수' },
];

// 💡 학과/영역: 나중에 백엔드에서 실제 크롤링 데이터로 대체 예정. 지금은 화면 확인용 목업.
const DEPARTMENT_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'BUSINESS', label: '경영학부' },
  { value: 'ECONOMICS', label: '경제학부' },
  { value: 'CS', label: '컴퓨터과학전공' },
  { value: 'SW_CONVERGENCE', label: '소프트웨어융합전공' },
  { value: 'AI', label: '인공지능공학부' },
  { value: 'DATA_SCIENCE', label: '데이터사이언스전공' },
  { value: 'IT', label: 'IT공학전공' },
  { value: 'MEDIA', label: '미디어학부' },
  { value: 'PR_AD', label: '홍보광고학과' },
  { value: 'CONSUMER_ECON', label: '소비자경제학과' },
  { value: 'PUBLIC_ADMIN', label: '행정학과' },
  { value: 'POLITICS', label: '정치외교학과' },
  { value: 'ENGLISH', label: '영어영문학부' },
  { value: 'JAPANESE', label: '일본학과' },
  { value: 'HISTORY', label: '역사문화학과' },
  { value: 'EDUCATION', label: '교육학부' },
  { value: 'VISUAL_DESIGN', label: '시각·영상디자인과' },
  { value: 'INDUSTRIAL_DESIGN', label: '산업디자인과' },
  { value: 'CLOTHING', label: '의류학과' },
  { value: 'FOOD_NUTRITION', label: '식품영양학과' },
];

const CourseSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 💡 PostWritePage에서 navigate(state)로 넘겨준 "어느 슬롯을 채울지" + "지금까지의 전체 선택 상태"
  const {
    target,
    priority,
    discardCourse: incomingDiscardCourse,
    wantedCourses: incomingWantedCourses,
  } = (location.state as {
    target?: 'discard' | 'wanted';
    priority?: number;
    discardCourse?: CourseSelection | null;
    wantedCourses?: (CourseSelection | null)[];
  }) || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [department, setDepartment] = useState('ALL');
  // 💡 UI 없이 항상 false로 고정 (졸업요건 필터 UI는 사용 안 하기로 함)
  const graduationOnly = false;
  // 💡 과목유형 필터: 'ALL'이면 전체, 값 있으면 그 유형만 (학과 필터와 AND로 결합)
  const [courseTypeFilter, setCourseTypeFilter] = useState('ALL');

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 💡 검색어 + 학과 + 졸업요건만 보기 옵션으로 실제 API 조회 (300ms 디바운스)
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/lectures', {
          params: {
            keyword: searchQuery.trim() || undefined,
            department: department !== 'ALL' ? department : undefined,
            graduationOnly,
          },
        });
        const rawCourses: CourseListItem[] = response.data?.data || [];
        // 💡 졸업요건에 해당하는 과목(isGraduationReq: true)이 맨 위로 오도록 정렬
        const sortedCourses = [...rawCourses].sort(
          (a, b) => Number(b.isGraduationReq) - Number(a.isGraduationReq),
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
  }, [searchQuery, department, graduationOnly]);

  const handleSelectCourse = (course: CourseListItem) => {
    const selectedCourse = {
      courseId: course.courseId,
      name: course.name,
      professor: course.professor,
      classTime: course.classTime,
      department: course.department,
      courseType: course.courseType,
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

    navigate('/board/write', {
      state: {
        discardCourse: updatedDiscardCourse,
        wantedCourses: updatedWantedCourses,
      },
      replace: true,
    });
  };

  // 💡 GET /api/lectures엔 courseType 파라미터가 없어서, 받아온 결과를 클라이언트에서 한 번 더 필터링
  const displayedCourses =
    courseTypeFilter !== 'ALL'
      ? courses.filter((course) => course.courseType === courseTypeFilter)
      : courses;

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
                options={DEPARTMENT_OPTIONS}
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
              const isMajorRequired = course.courseType === '전공필수';
              return (
                <button
                  key={course.courseId}
                  onClick={() => handleSelectCourse(course)}
                  className="relative w-full text-left bg-white rounded-lg border border-zinc-400 p-4 hover:bg-gray-50 transition-colors"
                >
                  {course.isGraduationReq && (
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
                    {isMajorRequired ? (
                      <Badge variant="lightBlueOutline" className="!rounded-lg">
                        {course.courseType}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outlineGray"
                        className="!bg-gray-200 !border-neutral-500 !text-zinc-900 !rounded-lg"
                      >
                        {course.courseType}
                      </Badge>
                    )}
                    {course.department && (
                      <Badge
                        variant="outlineGray"
                        className="!bg-gray-200 !border-neutral-500 !text-zinc-900 !rounded-lg"
                      >
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
