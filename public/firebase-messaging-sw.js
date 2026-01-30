// Firebase Messaging Service Worker
// Handles background notifications with WhatsApp-like behavior
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

// Notification channel configurations
const CHANNELS = {
  chat: {
    tag: 'chat-message',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      { action: 'reply', title: '💬 Reply' },
      { action: 'mark_read', title: '✓ Read' }
    ]
  },
  appointment: {
    tag: 'appointment',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  },
  emergency: {
    tag: 'emergency',
    vibrate: [500, 200, 500, 200, 500],
    requireInteraction: true,
    actions: [
      { action: 'accept', title: '✓ Accept' },
      { action: 'view', title: 'View Details' }
    ]
  },
  system: {
    tag: 'system',
    vibrate: [200],
    requireInteraction: false,
    actions: [
      { action: 'view', title: 'View' }
    ]
  }
};

// Handle background messages (data-only payloads)
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  // Extract data from data-only payload
  const data = payload.data || {};
  const type = data.type || 'system';
  const title = data.title || payload.notification?.title || 'New Notification';
  const body = data.body || payload.notification?.body || 'You have a new message';
  
  // Get channel config
  const channel = CHANNELS[type] || CHANNELS.system;
  
  // Build notification options
  const notificationOptions = {
    body: body,
    icon: '/images/mypaklabs-logo.png',
    badge: '/images/mypaklabs-logo.png',
    tag: `${channel.tag}-${data.entityId || Date.now()}`,
    data: {
      ...data,
      url: data.url || getDefaultUrl(type, data),
    },
    requireInteraction: channel.requireInteraction,
    vibrate: channel.vibrate,
    actions: channel.actions,
    silent: false,
    renotify: true,
  };

  // Show the notification
  self.registration.showNotification(title, notificationOptions);
});

// Get default URL based on notification type
function getDefaultUrl(type, data) {
  switch (type) {
    case 'chat':
      return data.roomId ? `/chat/${data.roomId}` : '/chats';
    case 'appointment':
      return '/my-bookings';
    case 'emergency':
      return data.requestId ? `/nurse-emergency-feed?requestId=${data.requestId}` : '/nurse-emergency-feed';
    default:
      return '/';
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  const type = data.type || 'system';
  
  // Handle dismiss action
  if (action === 'dismiss') {
    return;
  }
  
  // Handle mark_read action (just close, don't open)
  if (action === 'mark_read') {
    // Send message to app to mark as read
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'MARK_AS_READ',
          data: { roomId: data.roomId, entityId: data.entityId }
        });
      }
    });
    return;
  }
  
  // Determine URL to open
  let urlToOpen = data.url || '/';
  
  if (action === 'accept' && data.requestId) {
    urlToOpen = `/nurse-emergency-feed?requestId=${data.requestId}&action=accept`;
  } else if (action === 'reply' && data.roomId) {
    urlToOpen = `/chat/${data.roomId}`;
  } else if (action === 'view') {
    urlToOpen = data.url || getDefaultUrl(type, data);
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Send message to existing window
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: {
              ...data,
              action: action,
              url: urlToOpen
            }
          });
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle active room tracking
  if (event.data && event.data.type === 'SET_ACTIVE_ROOM') {
    // Store active room ID (for future use with notification filtering)
    self.activeRoomId = event.data.roomId;
  }
});
