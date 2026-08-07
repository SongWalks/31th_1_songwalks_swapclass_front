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
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || '알림', {
    body: body || '',
    icon: '/icons/icon-192.png',
    data: { url: '/alert' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/alert') && 'focus' in client)
            return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow('/alert');
      }),
  );
});
