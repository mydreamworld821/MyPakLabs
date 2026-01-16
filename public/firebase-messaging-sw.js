// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "AIzaSyAefCf0dqcnepcPqGFbbUTOQzhbYm7GhcA",
  authDomain: "mypaklabs-de6b5.firebaseapp.com",
  projectId: "mypaklabs-de6b5",
  storageBucket: "mypaklabs-de6b5.firebasestorage.app",
  messagingSenderId: "225226866980",
  appId: "1:225226866980:web:fb126fdd3ced8a6ae3b3b1"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/images/mypaklabs-logo.png',
    badge: '/images/mypaklabs-logo.png',
    tag: payload.data?.tag || 'default',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: payload.data || { url: '/' },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
