export type PushNotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

const SUBSCRIBE_URL = "/api/notifications/subscribe";
const TEST_URL = "/api/notifications/test";

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported by this browser.");
  }

  return navigator.serviceWorker.register("/sw.js");
}

export async function subscribeToPushNotifications(publicKey: string) {
  if (!publicKey) {
    throw new Error("Missing VAPID public key.");
  }

  const registration = await registerServiceWorker();
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    return existingSubscription;
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

export async function sendSubscriptionToServer(subscription: PushSubscription) {
  const response = await fetch(SUBSCRIBE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscription }),
  });

  if (!response.ok) {
    throw new Error("Failed to save push subscription.");
  }

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.error || "Failed to save push subscription.");
  }

  return true;
}

export async function requestNotificationPermissionAndSubscribe(
  publicVapidKey: string
) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error(
      "Push notifications are not supported by this browser."
    );
  }

  if (!("Notification" in window)) {
    throw new Error(
      "Notifications are not supported by this browser."
    );
  }

  const permission = await Notification.requestPermission();

  if (permission === "denied") {
    throw new Error(
      "Notifications are blocked. Enable them from iPhone Settings/Safari/Home Screen app settings."
    );
  }

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const subscription = await subscribeToPushNotifications(publicVapidKey);
  await sendSubscriptionToServer(subscription);
  return subscription;
}

export async function sendTestNotification() {
  const res = await fetch(TEST_URL, {
    method: "POST",
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.success) {
    throw new Error(payload?.error || "Failed to send test notification");
  }

  return payload;
}
