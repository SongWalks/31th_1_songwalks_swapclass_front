import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@iconify/react';
import { ICONS } from '@/constants/icons';
import { EmptyState } from '@/components/common/EmptyState';
import axiosInstance from '@/api/axiosInstance'; // 💡 프로젝트의 Axios 인스턴스 경로로 맞춰주세요!

// API Response 데이터 타입 정의 (명세서 기준)
// 💡 기존엔 course.name만 있었는데, 카드 디자인(교수/시간/태그 뱃지)을 그대로 보여주려면
// 이 필드들이 필요해요. 백엔드 응답에 아직 없다면 추가해달라고 요청해주세요 — 우선 옵셔널로 열어뒀어요.
interface CourseDetail {
  name: string;
  professor?: string;
  classTime?: string;
  tags?: {
    label: string;
    variant:
      | 'primary'
      | 'secondary'
      | 'lightBlue'
      | 'lightPink'
      | 'lightYellow'
      | 'outlineGray'
      | 'outlineBlue'
      | 'lightRed'
      | 'grayOutline'
      | 'bluesolid'
      | 'lightBlueOutline';
  }[];
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
        ) : registeredCourses.length === 0 ? (
          <EmptyState
            icon={<Icon icon={ICONS.WARNING} className="w-9 h-9 select-none" />}
            title="아직 등록된 졸업요건 과목이 없습니다."
            description={`졸업에 필요한 과목을 등록하고\n교환할 강의를 더 쉽게 찾아보세요.`}
            className="min-h-[50vh] justify-center"
          />
        ) : (
          <div className="flex flex-col gap-3 pb-10">
            {registeredCourses.map((item) => (
              <CourseCard
                key={item.id}
                title={
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-900 text-base font-semibold leading-6 tracking-tight">
                      {item.course.name}
                    </span>
                    {(item.course.professor || item.course.classTime) && (
                      <span className="text-slate-500 text-sm font-normal leading-5 tracking-wide">
                        {[item.course.professor, item.course.classTime]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </div>
                }

                badges={
                  item.course.tags &&
                  item.course.tags.filter((tag) => tag.label !== '졸업요건')
                    .length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {item.course.tags
                        .filter((tag) => tag.label !== '졸업요건')
                        .map((tag, idx) => (
                          <Badge key={idx} variant={tag.variant}>
                            {tag.label}
                          </Badge>
                        ))}
                    </div>
                  )
                }
                className={item.completed ? '!bg-neutral-50' : ''}
                // 💡 이수완료 체크는 별도 페이지에서 하기로 해서 여기선 클릭 이벤트 없이 상태만 보여줘요.
                // 미이수(completed === false)면 뱃지 자체를 아예 안 띄워요.
                rightNode={
                  item.completed ? (
                    <Badge variant="primary">이수완료</Badge>
                  ) : undefined
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
          onClick={() => navigate('/search')}
          className="w-full h-14 bg-brand-lightBlue hover:opacity-90 active:scale-[0.99] transition-all rounded-md text-white text-lg font-semibold font-['Pretendard'] leading-5 tracking-tight"
        >
          과목 추가하기
        </button>
      </div>
    </div>
  );
};

export default GraduationPage;
