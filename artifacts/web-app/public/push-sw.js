self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() || "You have a new notification." }; }
  event.waitUntil(self.registration.showNotification(data.title || "2torConnect", {
    body: data.body || "You have a new notification.",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    data: { link: data.link || "/" },
    tag: data.tag || "2torconnect-update",
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.link || "/", self.location.origin);
  if (target.origin !== self.location.origin) target.href = "/";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin) return client.navigate(target.href).then(() => client.focus());
    }
    return self.clients.openWindow(target.href);
  }));
});
