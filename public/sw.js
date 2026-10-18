// public/sw.js
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/logo.png",
    badge: "/badge.png",
    data: {
      url: data.url || "/orders",
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "HubConnect Update", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});