// public/sw.js
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 서버(FCM/Web Push)가 보낸 푸시를 받아서 브라우저 알림으로 표시
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: '알림', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || '알림';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png', // 👈 실제 아이콘 경로로 교체
    badge: '/icons/badge-72.png', // 👈 실제 배지 아이콘으로 교체
    data: {
      // 💡 요청대로 딥링크는 항상 /alert로 고정
      url: '/alert',
      notificationId: payload.notificationId ?? null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 시 /alert로 이동 (이미 열린 탭 있으면 그쪽 포커스)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/alert';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/alert') && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
