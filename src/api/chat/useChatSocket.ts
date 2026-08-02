// src/hooks/useChatSocket.ts
// STOMP 기반 실시간 채팅 (명세 9번)
// 연결: /ws, 발행: /app/chat/{roomId}/send, 구독: /topic/chat/{roomId}
// ⚠️ 인증은 Bearer 토큰(tokenStorage) 방식이라 STOMP CONNECT 프레임의
//    connectHeaders에 Authorization을 실어 보낸다.

import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import { API_BASE } from '@/api/chat/apiClient';
import { getTokens } from '../../store/tokenStorage';
import type { ChatMessageDto } from '@/api/chat/chatRoomApi';

const WS_URL = API_BASE
  ? `${API_BASE.replace(/^http/, 'ws')}/ws`
  : `${window.location.origin.replace(/^http/, 'ws')}/ws`;

interface UseChatSocketOptions {
  roomId: string;
  onMessage: (message: ChatMessageDto) => void;
  enabled?: boolean;
}

export function useChatSocket({
  roomId,
  onMessage,
  enabled = true,
}: UseChatSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !roomId) return;

    const tokens = getTokens();
    const client = new Client({
      brokerURL: WS_URL,
      // ⚠️ 재연결 시에도 매번 최신 토큰을 읽어야 access token 재발급 이후에도 정상 연결된다.
      beforeConnect: () => {
        const latest = getTokens();
        client.connectHeaders = latest?.accessToken
          ? { Authorization: `Bearer ${latest.accessToken}` }
          : {};
      },
      connectHeaders: tokens?.accessToken
        ? { Authorization: `Bearer ${tokens.accessToken}` }
        : {},
      reconnectDelay: 3000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/chat/${roomId}`, (frame: IMessage) => {
          try {
            const body: ChatMessageDto = JSON.parse(frame.body);
            onMessageRef.current(body);
          } catch (err) {
            // TODO: 파싱 실패 시 에러 로깅/모니터링 연동
            console.error('채팅 메시지 파싱 실패', err);
          }
        });
      },
      onStompError: (frame) => {
        // ⚠️ Authorization 만료로 인한 연결 거부(예: 401 상당 STOMP 에러)인 경우
        //    accessToken을 갱신한 뒤 재연결하는 로직이 필요할 수 있음 - 백엔드가 내려주는
        //    에러 헤더/코드 포맷 확인 후 보강할 것.
        console.error('STOMP 에러', frame.headers['message']);
      },
      onDisconnect: () => setIsConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [roomId, enabled]);

  const sendMessage = useCallback(
    (content: string) => {
      const client = clientRef.current;
      if (!client || !client.connected) {
        // TODO: 연결 안 된 상태에서 전송 시도 시 재시도 큐 또는 에러 토스트 처리
        console.error('채팅 서버에 연결되어 있지 않습니다.');
        return false;
      }
      client.publish({
        destination: `/app/chat/${roomId}/send`,
        body: JSON.stringify({ content }),
      });
      return true;
    },
    [roomId],
  );

  return { isConnected, sendMessage };
}
