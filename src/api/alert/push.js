import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/firebase';
import { getTokens } from '@/store/tokenStorage';
import { emitForegroundMessage } from '@/api/alert/msts';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '';
const DEVICE_TYPE = 'WEB';

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('이 브라우저는 Service Worker를 지원하지 않습니다.');
    return null;
  }
  try {
    return await navigator.serviceWorker.register('/fm-sw.js');
  } catch (err) {
    console.error('Service Worker 등록 실패:', err);
    return null;
  }
};

// 푸시 알림 구독 (로그인 시 / 알림 ON 시)
export const subscribeToPush = async () => {
  if (!('Notification' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, reason: 'denied' };
  }

  const registration =
    (await navigator.serviceWorker.getRegistration('/fm-sw.js')) ||
    (await registerServiceWorker());
  if (!registration) return { success: false, reason: 'no-sw' };

  let fcmToken;
  try {
    // 기존 토큰이 있으면 재사용하고, 없으면 새로 발급받음
    fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    console.error('FCM 토큰 발급 실패:', err);
    return { success: false, reason: 'token-failed' };
  }

  if (!fcmToken) return { success: false, reason: 'no-token' };

  // 서버에 토큰 등록 (서버는 동일 토큰 들어오면 덮어쓰기/재사용 처리)
  const token = getTokens()?.accessToken;
  const res = await fetch(`${API_BASE}/api/notifications/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      fcmToken,
      deviceType: DEVICE_TYPE,
    }),
  });

  onMessage(messaging, (payload) => {
    console.log('포그라운드 메시지 수신:', payload);
    const { title, body } = payload.notification || {};
    emitForegroundMessage(title || '알림', body || '');
  });

  return { success: res.ok, fcmToken };
};

// 푸시 알림 해제 (로그아웃 시 / 회원탈퇴 시 / 알림 OFF 시)
export const unsubscribeFromPush = async () => {
  const registration =
    (await navigator.serviceWorker.getRegistration('/fm-sw.js')) ||
    (await registerServiceWorker());

  let fcmToken;
  try {
    fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      ...(registration ? { serviceWorkerRegistration: registration } : {}),
    });
  } catch {
    return { success: true };
  }
  if (!fcmToken) return { success: true };

  const token = getTokens()?.accessToken;

  // 1. 서버 DB에서 해당 토큰 삭제
  try {
    await fetch(`${API_BASE}/api/notifications/subscriptions/${fcmToken}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    console.warn('서버 토큰 삭제 실패:', err);
  }

  // 2. Firebase SDK 클라이언트 토큰 삭제
  try {
    await deleteToken(messaging);
  } catch (err) {
    console.warn('Firebase 토큰 삭제 실패:', err);
  }

  return { success: true };
};
