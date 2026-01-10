// Service Worker for Push Notifications
const CACHE_NAME = 'mypaklab-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = {
    title: 'New Emergency Request!',
    body: 'A patient needs urgent nursing care nearby',
    icon: '/images/mypaklabs-logo.png',
    badge: '/images/mypaklabs-logo.png',
    tag: 'emergency-request',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: '/nurse-emergency-feed'
    }
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      vibrate: data.vibrate,
      data: data.data,
      actions: [
        { action: 'view', title: 'View Request' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/nurse-emergency-feed';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
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

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, data } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: '/images/mypaklabs-logo.png',
      badge: '/images/mypaklabs-logo.png',
      tag: 'emergency-request',
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: data || { url: '/nurse-emergency-feed' },
      actions: [
        { action: 'view', title: 'View Request' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});
