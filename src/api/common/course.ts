import axiosInstance from '@/api/axiosInstance';
import type {
  FetchCoursesParams,
  PaginatedCourses,
  DepartmentResponse,
} from '@/types/common/course';

export const fetchCourses = async (
  params: FetchCoursesParams,
): Promise<PaginatedCourses> => {
  const response = await axiosInstance.get('/api/lectures', {
    params: params,
  });

  console.log('백엔드 응답 데이터:', response.data);

  return response.data.data;
};

export const fetchDepartments = async (): Promise<DepartmentResponse[]> => {
  const response = await axiosInstance.get('/api/lectures/departments', {});
  return response.data.data;
};

export const fetchCategories = async (): Promise<string[]> => {
  const response = await axiosInstance.get('/api/lectures/categories', {});
  return response.data.data;
};
