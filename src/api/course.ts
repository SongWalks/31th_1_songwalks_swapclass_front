import axios from 'axios';
import type { Course } from '@/types/course';

const TEMP_TOKEN =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIyIiwiaWF0IjoxNzg1NTE2MTEzLCJleHAiOjE3ODU1MTc5MTN9.GRIsd2jcIguoJNwvf9rnCZdbn0LSgFVUF8KEoPuZV6v8dyLqXtTIqKz0lMs5CSAYVKppb7Of6ptzhnUPY7yNsg';

export interface FetchCoursesParams {
  keyword?: string;
  department?: string;
  category?: string;
  page?: number; // 무한스크롤용 페이지 번호 허용
}

export interface PaginatedCourses {
  content: Course[]; // 진짜 강의 데이터 배열
  page: number; // 현재 페이지
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean; // 다음 페이지 존재 여부
}

export const fetchCourses = async (
  params: FetchCoursesParams,
): Promise<PaginatedCourses> => {
  const response = await axios.get('/api/lectures', {
    headers: {
      Authorization: `Bearer ${TEMP_TOKEN}`,
    },
    params: params,
  });

  console.log('백엔드 응답 데이터:', response.data);

  // 이제 배열(content)만 꺼내주는게 아니라, hasNext 등이 포함된 data 통째로 반환합니다!
  return response.data.data;
};

export interface DepartmentResponse {
  type: string;
  value: string;
}

// 🚀 1. 학과 목록 API 호출
export const fetchDepartments = async (): Promise<DepartmentResponse[]> => {
  const response = await axios.get('/api/lectures/departments', {
    headers: {
      Authorization: `Bearer ${TEMP_TOKEN}`, // 토큰 설정이 필요하다면 유지
    },
  });
  return response.data.data;
};

// 🚀 2. 강의 유형(카테고리) API 호출
export const fetchCategories = async (): Promise<string[]> => {
  const response = await axios.get('/api/lectures/categories', {
    headers: {
      Authorization: `Bearer ${TEMP_TOKEN}`,
    },
  });
  return response.data.data;
};
