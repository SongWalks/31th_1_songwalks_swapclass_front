// src/api/exchangeApi.ts

import { apiGet, apiPost, apiPostForm } from '@/api/chat/apiClient';

// 백엔드 CancelRequest.reason이 String -> enum으로 변경됨에 따라 세부 사유별 값으로 교체
export type CancelReason =
  | 'MUTUAL_TIME_ISSUE' // 시간 조율 실패
  | 'MUTUAL_COURSE_CHANGE' // 서로 다른 과목으로 교환하고자 함
  | 'FRAUD_SUSPECT_IMAGE' // 보유 과목 인증 사진이 의심됨
  | 'FRAUD_DIFFERENT_COURSE' // 다른 과목 사진 제출
  | 'NO_SHOW_COURSE' // 과목을 버리지 않음
  | 'NO_SHOW_STOPPED' // 거래를 일방적으로 중단함
  | 'NO_CONTACT' // 상대방과 연락이 원활하지 않음 (프론트에서는 직접 파기 차단, 값만 보존)
  | 'OTHER'; // 기타 (detail 필드에 직접 입력)
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
  counterpartImageUrl?: string;
}

export interface CounterpartCaptureResponse {
  imageUrl: string | null;
}

export interface CountdownReadyData {
  status: 'WAITING' | 'COUNTDOWN_STARTED';
  message?: string;
  countdownEndsAt?: string; // ISO-8601 문자열 (양쪽 다 눌렀을 때만 내려옴)
}

export interface CountdownReadyResponse {
  success: boolean;
  data: CountdownReadyData;
  message: string;
}

export const exchangeApi = {
  // 1) 교환 시간 확정
  confirmSchedule: (exchangeId: number | string, scheduledAt: string) =>
    apiPost<ScheduleResponse>(`/api/exchanges/${exchangeId}/schedule`, {
      scheduledAt,
    }),

  // 2) 교환 결과 선택(성공/실패)
  submitResult: (exchangeId: number | string, result: 'SUCCESS' | 'FAIL') =>
    apiPost<ResultResponse>(`/api/exchanges/${exchangeId}/result`, {
      success: result === 'SUCCESS',
    }),

  // 3) 거래 파기 (reason은 세부 사유 enum, detail은 OTHER일 때만 사용)
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

  // 6) 상대방 캡처 이미지 조회
  getCounterpartCapture: (exchangeId: number | string) =>
    apiGet<CounterpartCaptureResponse>(
      `/api/exchanges/${exchangeId}/verifications/counterpart-capture`,
    ),

  // 7) 카운트다운 시작 준비 신호 전송 (양쪽 수신 확인용)
  readyCountdown: (exchangeId: number | string) =>
    apiPost<CountdownReadyResponse>(
      `/api/exchanges/${exchangeId}/countdown/ready`,
    ),
};
