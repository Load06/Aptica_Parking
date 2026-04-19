import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: { url: string; revision: string | null }[] };

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Navigation fallback
registerRoute(
  new NavigationRoute(new NetworkFirst(), {
    denylist: [/^\/api/],
  }),
);

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json() as { title?: string; body?: string; url?: string };
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Aptica Parking', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.startsWith(self.location.origin));
        if (existing) {
          existing.focus();
          (existing as WindowClient).navigate(url);
        } else {
          self.clients.openWindow(url);
        }
      }),
  );
});
