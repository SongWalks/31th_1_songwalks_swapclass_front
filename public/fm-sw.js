/* eslint-env serviceworker */
/* eslint-disable no-undef */
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js',
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js',
);

firebase.initializeApp({
  apiKey: 'AIzaSyDr1oDMxVD16CnI1KIP0o5kc0i5rbT5f2s',
  authDomain: 'swapclass-d9066.firebaseapp.com',
  projectId: 'swapclass-d9066',
  storageBucket: 'swapclass-d9066.firebasestorage.app',
  messagingSenderId: '833558323464',
  appId: '1:833558323464:web:a1eb4777861d3c45a68cbd',
});

const messaging = firebase.messaging();

// 백그라운드(탭이 안 열려있을 때) 수신
messaging.onBackgroundMessage((payload) => {
  console.log('[fm-sw.js] 백그라운드 메시지 수신:', payload);

  // 💡 백엔드에서 notification 객체를 포함해서 보낸 경우:
  // 브라우저/OS가 이미 1개의 알림을 자동으로 표시하므로 showNotification을 호출하지 않습니다.
  // data-only 페이로드(notification 없이 data만 전달된 경우)일 때만 수동으로 알림을 띄웁니다.
  if (!payload.notification && payload.data) {
    const title = payload.data.title || '알림';
    const body = payload.data.body || '';
    const url = payload.data.url || '/alert';

    self.registration.showNotification(title, {
      body: body,
      icon: '/icons/icon-192.png',
      data: { url: url },
      requireInteraction: true,
    });
  }
});

// 알림 클릭 이벤트 핸들러
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // 클릭 시 열어줄 URL (payload data에 지정된 url이 없으면 기본 '/alert'로 이동)
  const targetUrl = event.notification.data?.url || '/alert';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 해당 경로로 열려있는 탭이 있다면 창을 포커스
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // 열려있는 탭이 없으면 새 창으로 이동
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
