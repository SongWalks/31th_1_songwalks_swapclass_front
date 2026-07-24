import axiosInstance from './axiosInstance';

// --- [타입 정의] ---

// 일정 잡기 요청 DTO
export interface ScheduleExchangeRequest {
  scheduledAt: string; // ISO Date String (예: "2026-07-23T17:07:40.221Z")
}

// 결과 확정 요청 DTO
export interface ResultExchangeRequest {
  success: boolean;
}

// 취소/철회 요청 DTO
export interface CancelExchangeRequest {
  reason: string;
  detail: string;
}

// 공통 API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
}

// --- [API 호출 함수] ---

/**
 * 1. 교환 일정 잡기 API
 */
export const scheduleExchange = async (
  exchangeId: number,
  data: ScheduleExchangeRequest,
) => {
  const response = await axiosInstance.post<ApiResponse>(
    `/api/exchanges/${exchangeId}/schedule`,
    data,
  );
  return response.data;
};

/**
 * 2. 교환 결과(성공/실패) 확정 API
 */
export const submitExchangeResult = async (
  exchangeId: number,
  data: ResultExchangeRequest,
) => {
  const response = await axiosInstance.post<ApiResponse>(
    `/api/exchanges/${exchangeId}/result`,
    data,
  );
  return response.data;
};

/**
 * 3. 교환 취소 및 철회 API
 */
export const cancelExchange = async (
  exchangeId: number,
  data: CancelExchangeRequest,
) => {
  const response = await axiosInstance.post<ApiResponse>(
    `/api/exchanges/${exchangeId}/cancel`,
    data,
  );
  return response.data;
};
