import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE } from '@/api/chat/apiClient';
import { getTokens } from '../../store/tokenStorage';
import type { ChatMessageDto } from '@/api/chat/chatRoomApi';

const SOCKJS_URL = API_BASE ? `${API_BASE}/ws` : `${window.location.origin}/ws`;

interface RoomEventDto {
  type: string;
  seconds?: number;
  [key: string]: unknown;
}

interface UseChatSocketOptions {
  roomId: string;
  onMessage: (message: ChatMessageDto) => void;
  onRoomEvent?: (event: RoomEventDto) => void;
  enabled?: boolean;
}

export function useChatSocket({
  roomId,
  onMessage,
  onRoomEvent,
  enabled = true,
}: UseChatSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  const onRoomEventRef = useRef(onRoomEvent);
  onMessageRef.current = onMessage;
  onRoomEventRef.current = onRoomEvent;

  useEffect(() => {
    if (!enabled || !roomId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(SOCKJS_URL),
      beforeConnect: () => {
        const latest = getTokens();
        client.connectHeaders = latest?.accessToken
          ? { Authorization: `Bearer ${latest.accessToken}` }
          : {};
      },
      reconnectDelay: 3000,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe(`/topic/chat/${roomId}`, (frame: IMessage) => {
          try {
            const body: ChatMessageDto = JSON.parse(frame.body);
            onMessageRef.current(body);
          } catch (err) {
            console.error('채팅 메시지 파싱 실패', err);
          }
        });

        client.subscribe(`/topic/chat-rooms/${roomId}`, (frame: IMessage) => {
          try {
            const body: RoomEventDto = JSON.parse(frame.body);
            if (onRoomEventRef.current) {
              onRoomEventRef.current(body);
            }
          } catch (err) {
            console.error('방 이벤트 파싱 실패', err);
          }
        });
      },
      onStompError: (frame) => {
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
