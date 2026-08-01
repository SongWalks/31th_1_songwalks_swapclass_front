// src/api/push.js
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '';
// 👆 VAPID 공개키는 백엔드가 발급해줘야 해요. .env에 VITE_VAPID_PUBLIC_KEY=... 로 넣어두세요.

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('이 브라우저는 Service Worker를 지원하지 않습니다.');
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
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
    (await navigator.serviceWorker.getRegistration()) ||
    (await registerServiceWorker());
  if (!registration) return { success: false, reason: 'no-sw' };

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const subJson = subscription.toJSON();

  // 서버에 구독 정보 등록 (API 문서의 "펌푸시 구독 등록" 엔드포인트)
  const res = await fetch(`${API_BASE}/api/notifications/push-subscription`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
    }),
  });

  return { success: res.ok, subscription };
};

export const unsubscribeFromPush = async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return { success: true };

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  const res = await fetch(`${API_BASE}/api/notifications/push-subscription`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });

  return { success: res.ok };
};
