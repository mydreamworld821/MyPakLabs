import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAefCf0dqcnepcPqGFbbUTOQzhbYm7GhcA",
  authDomain: "mypaklabs-de6b5.firebaseapp.com",
  projectId: "mypaklabs-de6b5",
  storageBucket: "mypaklabs-de6b5.firebasestorage.app",
  messagingSenderId: "225226866980",
  appId: "1:225226866980:web:fb126fdd3ced8a6ae3b3b1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;

// Check if messaging is supported
export const isMessagingSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const getFirebaseMessaging = () => {
  if (!messaging && isMessagingSupported()) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.error("Failed to initialize Firebase Messaging:", error);
    }
  }
  return messaging;
};

// Get FCM token for push notifications
export const getFCMToken = async (): Promise<string | null> => {
  const fcmMessaging = getFirebaseMessaging();
  if (!fcmMessaging) {
    console.log("Firebase Messaging not supported");
    return null;
  }

  try {
    // Request notification permission first
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Get registration for the service worker
    const registration = await navigator.serviceWorker.ready;
    
    // Get FCM token
    const token = await getToken(fcmMessaging, {
      vapidKey: "YOUR_VAPID_KEY", // We'll need to add this
      serviceWorkerRegistration: registration,
    });

    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  const fcmMessaging = getFirebaseMessaging();
  if (!fcmMessaging) return () => {};

  return onMessage(fcmMessaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
};

export { app };
