import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import { Toast } from '@/components/common/Toast';
import { EmptyState } from '@/components/common/EmptyState';
import { ICONS } from '@/constants/icons';
import cautionBlueIcon from '@/assets/icons/caution_blue.svg';
import axiosInstance from '@/api/axiosInstance';

const GraduationAddPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [courses, setCourses] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('저장되었습니다.');

  // API 1: 목록 불러오기
  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get('/api/me/graduation-courses');
      if (response.data?.success) {
        const apiCourses = response.data.data.courses.map((c: any) => ({
          id: c.courseId,
          name: c.courseName,
          prof: 'John Smith',
          time: '화목 10:30-11:45',
          tags: ['lightBlueOutline', 'grayOutline'],
          tagNames: ['전공필수', '컴퓨터공학'],
          completed: c.completed,
        }));
        setCourses(apiCourses);
      }
    } catch (error) {
      console.error('목록 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // API 2: 과목 추가하기 (POST)
  const handleAddCourse = async (courseId: number, courseName: string) => {
    try {
      await axiosInstance.post('/api/me/graduation-courses', { courseId });
      setToastMessage(`${courseName}이(가) 추가되었습니다.`);
      setShowToast(true);
      fetchCourses();
    } catch (error) {
      console.error('과목 추가 실패:', error);
    }
  };

  // API 3: 이수 상태 변경 (PATCH)
  const handleToggleComplete = async (courseId: number) => {
    try {
      await axiosInstance.patch(`/api/me/graduation-courses/${courseId}`);
      fetchCourses();
    } catch (error) {
      console.error('이수 상태 변경 실패:', error);
    }
  };

  // 검색 필터링 로직
  const filteredCourses = courses.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 이수 완료되지 않은 과목 개수
  const remainingCoursesCount = courses.filter((item) => item.completed).length;

  return (
    <div className="relative w-full h-screen bg-[#FBFBFB] flex flex-col font-['Pretendard'] overflow-hidden">
      <div className="[&>header]:!border-none">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={
            <div className="text-left px-4 whitespace-nowrap transform -translate-x-12 text-black/70 text-xl font-semibold leading-5 tracking-wide">
              졸업 요건 과목 등록
            </div>
          }
          rightNode={<IconButton icon={ICONS.BELL} />}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-5 pt-4 pb-2">
          <div className="w-full h-11 bg-white rounded-3xl border border-gray-200 px-5 flex items-center justify-between">
            <input
              placeholder="검색어를 입력해주세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm font-light text-black placeholder-neutral-400 leading-5 tracking-wide"
            />
            <Icon
              icon={ICONS.SEARCH}
              alt="검색"
              className="w-[18px] h-[18px] text-gray-400 cursor-pointer"
            />
          </div>
        </div>

        <div className="px-5 pt-3 pb-1 text-sm font-light leading-5">
          <span className="text-zinc-900">등록된 과목 </span>
          <span className="text-blue-400">{remainingCoursesCount}</span>
        </div>

        <div className="px-5 pt-1 pb-6 flex flex-col gap-3">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((item) => (
              <CourseCard
                key={item.id}
                title={
                  <span className="text-zinc-900 text-base font-semibold leading-3">
                    {item.name}
                  </span>
                }
                professor={
                  <span className="text-slate-500 text-sm font-normal leading-3">{`${item.prof} · ${item.time}`}</span>
                }
                className={
                  !item.completed
                    ? '!bg-neutral-50 !border-zinc-400'
                    : '!border-zinc-300'
                }
                rightNode={
                  searchQuery.trim() ? (
                    <button
                      onClick={() => handleAddCourse(item.id, item.name)}
                      className="w-7 h-7 rounded-full bg-blue-100 text-brand-lightBlue flex items-center justify-center shrink-0 hover:bg-blue-200 transition-colors"
                      aria-label="과목 추가"
                    >
                      <Icon icon="mdi:plus" className="text-lg" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleComplete(item.id)}
                      className={`px-3 py-1 rounded-md text-xs font-light cursor-pointer ${item.completed ? 'bg-brand-lightBlue text-white' : 'bg-gray-200 text-white'}`}
                    >
                      {item.completed ? '이수완료' : '이수완료'}
                    </button>
                  )
                }
                badges={
                  <div className="flex gap-2">
                    {item.tags.map((variant: any, index: number) => (
                      <Badge key={index} variant={variant}>
                        {item.tagNames[index]}
                      </Badge>
                    ))}
                  </div>
                }
              />
            ))
          ) : (
            <>
              <EmptyState
                icon={
                  <img
                    src={cautionBlueIcon}
                    alt="Caution"
                    className="w-9 h-9 select-none"
                  />
                }
                title="검색 결과가 없습니다."
                description={``}
                className="min-h-[50vh] justify-center"
              />
            </>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 w-full px-5 pb-6 pt-4 bg-[#FBFBFB] flex flex-col items-center border-t border-gray-100">
        <div className="text-center justify-center mb-4">
          <span className="text-cyan-900 text-base font-bold leading-5">
            현재 등록된 과목 {remainingCoursesCount}
            <br />
          </span>
          <span className="text-cyan-900 text-sm font-light leading-5">
            등록한 과목은 과목 검색 시 가장 먼저 표시됩니다
          </span>
        </div>
        <button
          onClick={() => {
            setToastMessage('저장되었습니다.');
            setShowToast(true);
          }}
          className="w-full h-14 bg-brand-lightBlue transition-all rounded-md text-white text-lg font-semibold"
        >
          저장하기
        </button>
      </div>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default GraduationAddPage;
