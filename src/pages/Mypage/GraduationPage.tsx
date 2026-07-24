import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { Icon } from '@iconify/react';
import { ICONS } from '@/constants/icons';
import { EmptyState } from '@/components/common/EmptyState';
import cautionBlueIcon from '@/assets/icons/caution_blue.svg';
import axiosInstance from '@/api/axiosInstance'; // 💡 프로젝트의 Axios 인스턴스 경로로 맞춰주세요!

// API Response 데이터 타입 정의 (명세서 기준)
interface CourseDetail {
  name: string;
}

interface GraduationCourse {
  id: number;
  course: CourseDetail;
  completed: boolean;
}

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
      setLoading(true);
      const response = await axiosInstance.get('/graduation/courses', {
        params: query ? { q: query } : {},
      });
      if (response.data?.success) {
        setRegisteredCourses(response.data.data.courses);
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

  // 2. 이수 완료 토글 API (true ↔ false)
  const handleToggleComplete = async (courseId: number) => {
    try {
      const response = await axiosInstance.patch(
        `/graduation/courses/${courseId}/complete`,
      );
      if (response.data?.success) {
        const updatedStatus = response.data.data.completed;
        // 상태값 즉시 반영
        setRegisteredCourses((prev) =>
          prev.map((item) =>
            item.id === courseId ? { ...item, completed: updatedStatus } : item,
          ),
        );
      }
    } catch (error) {
      console.error('이수 상태 변경 실패:', error);
      alert('이수 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 3. 등록된 졸업 요건 과목 삭제 API
  const handleDeleteCourse = async (courseId: number, courseName: string) => {
    if (
      !window.confirm(
        `'${courseName}' 과목을 졸업 요건 목록에서 삭제하시겠습니까?`,
      )
    ) {
      return;
    }

    try {
      const response = await axiosInstance.delete(
        `/graduation/courses/${courseId}`,
      );
      if (response.data?.success) {
        setRegisteredCourses((prev) =>
          prev.filter((item) => item.id !== courseId),
        );
      }
    } catch (error) {
      console.error('과목 삭제 실패:', error);
      alert('과목 삭제 중 오류가 발생했습니다.');
    }
  };

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
              <div className="text-left whitespace-nowrap transform -translate-x-12 text-black/70 text-xl font-semibold leading-5 tracking-wide">
                졸업 요건 과목 등록
              </div>
            }
            rightNode={
              <button
                onClick={() => navigate('add')}
                className="w-7 h-7 flex items-center justify-center text-black/40 hover:opacity-80 active:scale-95 transition-all"
                aria-label="과목 추가"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-5 h-5"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
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
            alt="검색"
            className="w-[18px] h-[18px] text-gray-400 cursor-pointer"
          />
        </div>
      </div>

      {/* 3. 등록된 과목 개수 + 추가하기 버튼 */}
      <div className="px-5 pt-3 pb-1 flex items-center justify-between">
        <div className="text-sm font-light leading-5 ">
          <span className="text-zinc-900">등록된 과목 </span>
          <span className="text-blue-400">{registeredCourses.length}</span>
        </div>
        <button
          onClick={() => navigate('add')}
          className="h-5 px-2 flex items-center justify-center gap-0.5 bg-blue-100 rounded-lg border-[0.5px] border-blue-400 text-zinc-900 text-xs font-light leading-5 tracking-wide hover:opacity-80 transition-opacity"
        >
          추가하기
          <span className="text-blue-400 text-xs">+</span>
        </button>
      </div>

      {/* 4. 리스트 / Empty State 출력 영역 */}
      <div className="flex-1 px-5">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            목록을 불러오는 중입니다...
          </div>
        ) : registeredCourses.length === 0 ? (
          <EmptyState
            icon={
              <img
                src={cautionBlueIcon}
                alt="Caution"
                className="w-9 h-9 select-none"
              />
            }
            title="아직 등록된 졸업요건 과목이 없습니다."
            description={`졸업에 필요한 과목을 등록하고\n교환할 강의를 더 쉽게 찾아보세요.`}
            className="min-h-[50vh] justify-center"
          />
        ) : (
          <div className="flex flex-col divide-y divide-gray-100 pb-10">
            {registeredCourses.map((item) => (
              <div
                key={item.id}
                className="py-4 flex items-center justify-between"
              >
                {/* 과목명 (이수 완료 시 취소선 및 옅은 색상 스타일링) */}
                <span
                  className={`text-sm tracking-wide font-normal ${
                    item.completed ? 'line-through text-gray-400' : 'text-black'
                  }`}
                >
                  {item.course.name}
                </span>

                <div className="flex items-center gap-2">
                  {/* 이수 완료 토글 버튼 */}
                  <button
                    onClick={() => handleToggleComplete(item.id)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      item.completed
                        ? 'bg-blue-50 text-brand-lightBlue border border-brand-lightBlue'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {item.completed ? '✅ 이수 완료' : '이수 완료'}
                  </button>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() =>
                      handleDeleteCourse(item.id, item.course.name)
                    }
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="과목 삭제"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. 하단 안내 문구 + 버튼 */}
      <div className="px-5 pb-6 pt-4 bg-[#FBFBFB]">
        <p className="text-center text-cyan-900 text-base font-bold font-['Pretendard'] leading-5 tracking-tight mb-7">
          등록한 과목은 과목 검색 시 가장 먼저 표시됩니다
        </p>
        <button
          onClick={() => navigate('add')}
          className="w-full h-14 bg-brand-lightBlue hover:opacity-90 active:scale-[0.99] transition-all rounded-md text-white text-lg font-semibold font-['Pretendard'] leading-5 tracking-tight"
        >
          과목 추가하기
        </button>
      </div>
    </div>
  );
};

export default GraduationPage;
