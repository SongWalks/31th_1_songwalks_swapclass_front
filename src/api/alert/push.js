import { getToken, deleteToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/firebase';
import { getTokens } from '@/store/tokenStorage';
import { emitForegroundMessage } from '@/api/alert/msts';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
// 👇 이건 Firebase Console > 프로젝트 설정 > Cloud Messaging > 웹 푸시 인증서에서 발급받은 VAPID 키
//    (기존 raw Web Push용 VAPID_PUBLIC_KEY와는 다른 값입니다 — 헷갈리지 않게 새 env 변수로 분리 권장)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY ?? '';

// 👇 deviceType 값은 백엔드에 확정 값 확인 필요 (예: 'WEB' 등)
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
    fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    console.error('FCM 토큰 발급 실패:', err);
    return { success: false, reason: 'token-failed' };
  }

  if (!fcmToken) return { success: false, reason: 'no-token' };

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

  // 포그라운드(탭이 열려있을 때) 수신 리스너도 등록해두는 걸 권장
  onMessage(messaging, (payload) => {
    console.log('포그라운드 메시지 수신:', payload);
    const { title, body } = payload.notification || {};
    emitForegroundMessage(title || '알림', body || '');
  });

  return { success: res.ok, fcmToken };
};

export const unsubscribeFromPush = async () => {
  let fcmToken;
  try {
    fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
  } catch {
    return { success: true }; // 이미 토큰이 없으면 해제할 것도 없음
  }
  if (!fcmToken) return { success: true };

  await deleteToken(messaging);

  const token = getTokens()?.accessToken;
  const res = await fetch(
    `${API_BASE}/api/notifications/subscriptions/${fcmToken}`,
    {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  return { success: res.ok };
};
