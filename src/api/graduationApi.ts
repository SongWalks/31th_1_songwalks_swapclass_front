import axiosInstance from './axiosInstance';

// 1. 타입 정의
export interface GraduationCourseItem {
  id: number;
  courseId: number;
  courseName: string;
  completed: boolean;
}

export interface GraduationCoursesResponse {
  success: boolean;
  data: {
    courses: GraduationCourseItem[];
  };
  message: string;
}

// ==========================================
// 💡 졸업 요건 과목 API 함수들
// ==========================================

// 1. 등록된 졸업 요건 과목 목록 조회 (검색어 q 옵션 지원)
export const getGraduationCourses = async (query?: string) => {
  const params = query ? { q: query } : {};
  const response = await axiosInstance.get<GraduationCoursesResponse>(
    '/api/me/graduation-courses',
    {
      params,
    },
  );
  return response.data;
};

// 2. 졸업 요건 과목 추가
export const addGraduationCourse = async (courseId: number) => {
  const response = await axiosInstance.post('/api/me/graduation-courses', {
    courseId,
  });
  return response.data;
};

// 3. 졸업 요건 과목 삭제
export const deleteGraduationCourse = async (courseId: number) => {
  const response = await axiosInstance.delete(
    `/api/me/graduation-courses/${courseId}`,
  );
  return response.data;
};

// 4. 졸업 요건 과목 이수 상태 변경 (PATCH)
export const updateGraduationCourseStatus = async (
  courseId: number,
  completed: boolean,
) => {
  const response = await axiosInstance.patch(
    `/api/me/graduation-courses/${courseId}`,
    {
      completed,
    },
  );
  return response.data;
};
