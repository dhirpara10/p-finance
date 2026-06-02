self.addEventListener("push", (event) => {
  let payload = {
    title: "Finance reminder",
    body: "Open the app to record today’s money moves.",
    url: "/",
  };

  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (error) {
    console.error("Failed to parse push payload", error);
  }

  const title = payload.title || "Finance reminder";
  const options = {
    body: payload.body || "Open the app to record today’s money moves.",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl || client.url === new URL(targetUrl, self.location.origin).href) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
