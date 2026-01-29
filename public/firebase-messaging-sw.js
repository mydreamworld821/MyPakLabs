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
  
  const data = payload.data || {};
  const isEmergency = data.type === 'emergency_request';
  const isChatMessage = data.type === 'chat_message';
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  
  // Determine notification options based on type
  let notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/images/mypaklabs-logo.png',
    badge: '/images/mypaklabs-logo.png',
    tag: data.tag || data.requestId || data.roomId || 'default',
    data: {
      ...data,
      url: data.url || (isEmergency ? '/nurse-emergency-feed' : '/'),
    },
  };

  if (isEmergency) {
    notificationOptions = {
      ...notificationOptions,
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500],
      actions: [
        { action: 'accept', title: '✓ Accept' },
        { action: 'view', title: 'View Details' }
      ]
    };
  } else if (isChatMessage) {
    notificationOptions = {
      ...notificationOptions,
      requireInteraction: false,
      vibrate: [100, 50, 100], // Short double vibration like WhatsApp
      silent: false,
      actions: [
        { action: 'reply', title: '💬 Reply' },
        { action: 'mark_read', title: '✓ Mark Read' }
      ]
    };
  } else {
    notificationOptions = {
      ...notificationOptions,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  // Determine URL based on action and notification type
  let urlToOpen = data.url || '/';
  
  if (action === 'accept' && data.requestId) {
    // For emergency accept, go to emergency feed with request ID
    urlToOpen = `/nurse-emergency-feed?requestId=${data.requestId}`;
  } else if (action === 'reply') {
    // For chat reply, go to chat room
    urlToOpen = data.url || '/chats';
  } else if (action === 'mark_read') {
    // Just close notification without opening
    return;
  } else if (action === 'view') {
    urlToOpen = data.url || '/';
  } else if (action === 'dismiss') {
    // Just close notification, don't open app
    return;
  }
  
  // Add emergency data to URL so the app can show the booking card
  if (data.type === 'emergency_request' && data.requestId) {
    const separator = urlToOpen.includes('?') ? '&' : '?';
    urlToOpen = `${urlToOpen}${separator}showRequest=${data.requestId}`;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Send message to the existing window
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: {
              ...data,
              action: action,
            }
          });
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
