self.addEventListener("push", function (event) {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: "Stockly", body: event.data.text() }; }

  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    tag: "stockly",
    renotify: true,
    data: { url: "/" },
  };
  event.waitUntil(self.registration.showNotification(payload.title || "Stockly", options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
