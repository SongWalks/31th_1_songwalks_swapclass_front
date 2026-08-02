// src/api/chatRoomApi.ts
// 스웨거 기준 /api/chat-rooms/{roomId}/... 엔드포인트

import { apiGet, apiPost } from '@/api/chat/apiClient';

export type ChatRoomStatus = string; // 백엔드 enum 예: 'CHATTING' | 'VERIFYING' | 'READY' | 'COUNTDOWN' | ...

export interface ChatMessageDto {
  id: number;
  senderId: number;
  content: string;
  type: 'TEXT' | 'SYSTEM';
  createdAt: string;
}

export interface ChatRoomDto {
  room: {
    id: number;
    status: ChatRoomStatus;
    exchangeId: number;
  };
  messages: ChatMessageDto[];
}

export interface MessagesDto {
  messages: ChatMessageDto[];
}

export const chatRoomApi = {
  // 채팅방 상태 + 메시지 내역 (커서 페이징)
  getRoom: (
    roomId: number | string,
    params?: { before?: string; size?: number },
  ) => apiGet<ChatRoomDto>(`/api/chat-rooms/${roomId}`, params),

  // 메시지 목록만 조회 (커서 페이징)
  getMessages: (
    roomId: number | string,
    params?: { before?: string; size?: number },
  ) => apiGet<MessagesDto>(`/api/chat-rooms/${roomId}/messages`, params),

  // STOMP 연결 끊김 시 폴백용 (명세 3번, REST 사용은 권장하지 않지만 fallback으로만 사용)
  sendMessage: (roomId: number | string, content: string) =>
    apiPost<MessagesDto>(`/api/chat-rooms/${roomId}/messages`, { content }),
};
