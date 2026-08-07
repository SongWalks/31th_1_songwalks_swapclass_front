import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  fetchCourses,
  fetchDepartments,
  fetchCategories,
} from '@/api/common/course';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { CourseCard } from '@/components/common/CourseCard';
import { Dropdown } from '@/components/common/Dropdown';
import { ICONS } from '@/constants/icons';
import { IconButton } from '@/components/common/IconButton';

export const CourseSearchPage = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  // 백엔드 API 요청 지연(디바운스)을 위한 상태 추가
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  const [lectureType, setLectureType] = useState('all');
  const [department, setDepartment] = useState('all');

  const [openDropdown, setOpenDropdown] = useState<'type' | 'dept' | null>(
    null,
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // 드롭다운 요소가 존재하고, 클릭된 타겟이 드롭다운 영역 바깥일 경우
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null); // 드롭다운 닫기
      }
    };

    // PC 환경을 위한 mousedown, 모바일 환경을 위한 touchstart 이벤트 등록
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      // 컴포넌트 언마운트 시 이벤트 리스너 정리(메모리 누수 방지)
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // 감시자 역할을 할 ref 생성 (이 div가 화면에 보이면 다음 페이지 호출)
  const observerRef = useRef<HTMLDivElement>(null);

  // 타이핑(searchQuery 변경)이 멈추고 0.3초 뒤에 debouncedQuery를 업데이트
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    // 0.3초 안에 다시 타이핑하면 이전 타이머 취소
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 카테고리 데이터 불러오기
  const { data: categoryData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // 학과 데이터 불러오기
  const { data: departmentData = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });

  const typeOptions = useMemo(() => {
    const options = categoryData.map((category) => ({
      value: category,
      label: category,
    }));
    return [{ value: 'all', label: '전체' }, ...options];
  }, [categoryData]);

  const deptOptions = useMemo(() => {
    const options = departmentData.map((dept) => ({
      value: dept.value,
      label: dept.value,
    }));
    return [{ value: 'all', label: '전체' }, ...options];
  }, [departmentData]);

  const queryParams = {
    keyword: debouncedQuery || undefined,
    category: lectureType !== 'all' ? lectureType : undefined,
    department: department !== 'all' ? department : undefined,
  };

  const { data, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['courses', queryParams],
      queryFn: ({ pageParam = 0 }) =>
        fetchCourses({ ...queryParams, page: pageParam }),
      getNextPageParam: (lastPage) => {
        return lastPage.hasNext ? lastPage.page + 1 : undefined;
      },
      initialPageParam: 0,
    });

  // 스크롤이 맨 밑에 닿았을 때 fetchNextPage 실행
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // observerRef가 화면에 노출되었고, 다음 페이지가 있고, 현재 데이터를 불러오는 중이 아니라면
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }, // 100% 다 보였을 때 트리거
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 페이지별로 나뉜 데이터를 하나의 배열로 합치고(flat) 정렬하기
  const sortedCourses = useMemo(() => {
    if (!data?.pages) return [];

    // 1) 모든 페이지 데이터를 1차원 배열로 평탄화
    const allCourses = data.pages.flatMap((page) =>
      Array.isArray(page) ? page : page.content || [],
    );

    // 🌟 2) Map을 활용하여 courseId를 기준으로 중복 제거 (핵심 추가 코드)
    const uniqueCourses = Array.from(
      new Map(allCourses.map((course) => [course.courseId, course])).values(),
    );

    // 3) 졸업 요건 여부에 따라 분류
    const graduationRequired = uniqueCourses.filter(
      (course) => course.myGraduationCourse,
    );
    const nonRequired = uniqueCourses.filter(
      (course) => !course.myGraduationCourse,
    );

    // 4) 합쳐서 반환
    return [...graduationRequired, ...nonRequired];
  }, [data]);

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <p className="text-red-500">데이터를 불러오는 데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full flex flex-col overflow-hidden">
      <div className="shrink-0 w-full z-20">
        {/* 헤더 부분 */}
        <div className="flex items-center px-4 h-[80px] gap-2">
          <IconButton
            icon={ICONS.BACK}
            onClick={() => navigate(-1)}
            className="-ml-2 text-gray-500"
          />
          <div className="flex-1">
            <Input
              variant="pill"
              placeholder="검색어를 입력해주세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightNode={
                <Icon
                  icon={ICONS.SEARCH}
                  className="text-[20px] text-gray-400"
                />
              }
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative pb-[80px]">
        <div className="px-4 py-5 border-b border-gray-100 relative z-[60]">
          <button
            onClick={() => navigate(-1)}
            className="text-brand-lightBlue text-bold-16 mb-3 transition-colors hover:text-brand-blue"
          >
            필터 닫기
          </button>

          <div
            ref={dropdownRef}
            className="p-4 bg-brand-bg border border-brand-lightBlue rounded-xl shadow-sm space-y-4 animate-in fade-in duration-200"
          >
            <div className="space-y-2">
              <label className="block text-medium-12 text-gray-800">
                강의 유형
              </label>
              <Dropdown
                options={typeOptions}
                value={lectureType}
                onChange={(val) => {
                  setLectureType(val);
                  setOpenDropdown(null); // 항목 선택 시 닫히도록 설정
                }}
                isOpen={openDropdown === 'type'}
                onToggle={() =>
                  setOpenDropdown((prev) => (prev === 'type' ? null : 'type'))
                }
              />
            </div>

            {/* 🚀 5. 가공된 deptOptions 적용 */}
            <div className="space-y-2">
              <label className="block text-medium-12 text-gray-800">
                학과/영역
              </label>
              <Dropdown
                options={deptOptions}
                value={department}
                onChange={(val) => {
                  setDepartment(val);
                  setOpenDropdown(null); // 항목 선택 시 닫히도록 설정
                }}
                isOpen={openDropdown === 'dept'}
                onToggle={() =>
                  setOpenDropdown((prev) => (prev === 'dept' ? null : 'dept'))
                }
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {sortedCourses.length > 0 ? (
            <>
              {sortedCourses.map((course) => (
                <CourseCard
                  key={course.courseId}
                  className="cursor-pointer transition-transform active:scale-[0.98] shadow-sm relative"
                  onClick={() => {
                    // 1. 선택된 과목 데이터를 sessionStorage에 텍스트(JSON)로 저장합니다.
                    // (title 속성을 넣어 글쓰기 페이지가 원하는 형태로 맞춰줍니다)
                    const courseDataToSave = { ...course, title: course.name };
                    sessionStorage.setItem(
                      'selectedCourse',
                      JSON.stringify(courseDataToSave),
                    );

                    // 2. 새로운 페이지를 얹는 대신, 현재 창을 닫고 '뒤로 가기'를 실행합니다.
                    navigate(-1);
                  }}
                  title={course.name}
                  professor={course.professor}
                  time={course.classTime}
                  badges={
                    <>
                      {course.myGraduationCourse && (
                        <Badge
                          variant="primary"
                          className="absolute top-4 right-4"
                        >
                          졸업요건
                        </Badge>
                      )}
                      <Badge
                        variant={
                          [
                            '전공선택',
                            '전공필수',
                            '교양선택',
                            '교양필수',
                            '교양핵심',
                          ].includes(course.category)
                            ? course.courseType === '학과전공'
                              ? 'lightYellow'
                              : 'lightBlue'
                            : 'outlineBlue'
                        }
                      >
                        {course.category}
                      </Badge>
                      {course.department && (
                        <Badge variant="secondary">{course.department}</Badge>
                      )}
                    </>
                  }
                />
              ))}

              {/* 🚀 4. 무한 스크롤 감지용 투명한 div (여기 닿으면 다음 페이지 호출) */}
              <div
                ref={observerRef}
                className="h-10 flex items-center justify-center"
              >
                {isFetchingNextPage && (
                  <p className="text-gray-400 text-sm">더 불러오는 중...</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-10">
              조건에 맞는 강의가 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[60px] bg-brand-soft flex items-center justify-center z-50">
        <p className="text-brand-navy text-medium-15 tracking-tight">
          졸업 요건에 해당하는 과목이 상단에 표시됩니다
        </p>
      </div>
    </div>
  );
};
