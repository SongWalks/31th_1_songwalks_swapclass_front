// src/api/exchangeApi.ts
// 스웨거 기준 /api/exchanges/{exchangeId}/... 엔드포인트
// ⚠️ roomId 가 아니라 exchangeId 를 사용해야 한다. exchangeId는
//    chatRoomApi.getRoom(roomId) 응답의 data.room.exchangeId 로 얻는다.

import { apiPost, apiPostForm } from '@/api/chat/apiClient';

export type CancelReason = 'MUTUAL' | 'FRAUD' | 'ABUSE' | 'OTHER';
// ⚠️ MONEY_DEMAND 는 백엔드 enum에는 있으나 기획/디자인상 선택 UI가 없어 프론트에서는 사용하지 않는다.

export interface ScheduleResponse {
  scheduledAt: string;
  autoConfirmAt: string;
}

export interface ResultResponse {
  exchangeStatus: string;
  message: string;
}

export interface QrResponse {
  qrToken: string;
  qrImageUrl: string;
  expiresAt: string;
}

export interface CaptureResponse {
  qrValid: boolean;
  status: string; // 'PASSED' | 'FAILED'
  message: string;
}

export const exchangeApi = {
  // 1) 교환 시간 확정
  confirmSchedule: (exchangeId: number | string, scheduledAt: string) =>
    apiPost<ScheduleResponse>(`/api/exchanges/${exchangeId}/schedule`, {
      scheduledAt,
    }),

  // 2) 교환 결과 선택(성공/실패)
  // 스웨거 예시 바디가 { success: true } 형태이므로 SUCCESS -> true, FAIL -> false 로 매핑한다.
  // ⚠️ FAIL 케이스의 실제 바디 예시가 스웨거에 없어 백엔드팀 확인이 되면 값 매핑을 재검증할 것.
  submitResult: (exchangeId: number | string, result: 'SUCCESS' | 'FAIL') =>
    apiPost<ResultResponse>(`/api/exchanges/${exchangeId}/result`, {
      success: result === 'SUCCESS',
    }),

  // 3) 거래 파기
  cancel: (
    exchangeId: number | string,
    reason: CancelReason,
    detail?: string,
  ) =>
    apiPost<string>(`/api/exchanges/${exchangeId}/cancel`, { reason, detail }),

  // 4) 강의 보유 인증 QR 생성 (교환 5분 전 VERIFYING 상태에서만 호출 가능)
  createQr: (exchangeId: number | string) =>
    apiPost<QrResponse>(`/api/exchanges/${exchangeId}/verifications/qr`),

  // 5) 화면 캡처 업로드 + QR 검증
  uploadCapture: (exchangeId: number | string, image: Blob) => {
    const formData = new FormData();
    formData.append('image', image, 'capture.png');
    return apiPostForm<CaptureResponse>(
      `/api/exchanges/${exchangeId}/verifications/capture`,
      formData,
    );
  },
};
