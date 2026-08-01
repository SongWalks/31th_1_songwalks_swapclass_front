import axiosInstance from '@/api/axiosInstance';

// ==========================================
// 1. 타입 정의
// ==========================================

// 내 정보(프로필) 데이터 타입
export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  penaltyCount: number;
  mannerWarningCount: number;
  status: string;
  notificationEnabled: boolean;
}

// API 응답 기본 구조
interface BaseResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ==========================================
// 2. 마이페이지 API 함수들
// ==========================================

/**
 * [GET] 내 정보 조회
 * - 마이페이지 진입 시 사용자 프로필 정보를 불러옵니다.
 */
export const getUserProfile = async () => {
  const response =
    await axiosInstance.get<BaseResponse<UserProfile>>('/api/users/me');
  return response.data;
};

/**
 * [PATCH] 비밀번호 변경
 * - 현재 비밀번호와 새 비밀번호를 입력받아 변경합니다.
 */
export const updatePassword = async (data: {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}) => {
  const response = await axiosInstance.patch<BaseResponse<string>>(
    '/api/users/me/password',
    data,
  );
  return response.data;
};

/**
 * [PATCH] 푸시 알림 설정 변경 (토글)
 * - 알림 수신 동의 여부(true/false)를 변경합니다.
 */
export const updateNotification = async (notificationEnabled: boolean) => {
  const response = await axiosInstance.patch<
    BaseResponse<{ notificationEnabled: boolean }>
  >('/api/users/me/notification', {
    notificationEnabled,
  });
  return response.data;
};

/**
 * [DELETE] 회원 탈퇴
 * - 현재 로그인된 사용자의 계정을 삭제(탈퇴)합니다.
 */
export const deleteAccount = async () => {
  const response =
    await axiosInstance.delete<BaseResponse<string>>('/api/users/me');
  return response.data;
};
