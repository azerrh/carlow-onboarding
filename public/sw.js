/*
 * Service Worker Carlow — minimal, dédié aux Web Push notifications.
 *
 * Scope : sert la racine (/). Enregistré par useWebPush() côté client.
 *
 * Stratégie volontairement simple :
 *  - Pas de cache offline (Next.js gère bien le caching navigateur).
 *  - Uniquement les handlers `push` et `notificationclick`.
 *
 * Format du payload attendu (JSON) :
 *   { title, body, icon?, url? }
 *
 * Si le serveur envoie un payload non-JSON, on tombe sur un fallback
 * générique plutôt que de planter silencieusement.
 */

self.addEventListener("install", (event) => {
  // skipWaiting fait passer le SW en "active" sans attendre que tous les
  // onglets soient fermés — pratique pour le déploiement de fixes urgents.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Carlow",
    body: "Vous avez une nouvelle notification",
    icon: "/file.svg",
    url: "/",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      // Payload non-JSON : on prend le texte brut comme body.
      try {
        data.body = event.data.text();
      } catch {
        // ignore
      }
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.icon,
    data: { url: data.url },
    // Vibration mobile pattern (200ms vibration, 100ms pause, 200ms vibration).
    vibrate: [200, 100, 200],
    tag: data.tag, // permet de remplacer une notif précédente si même tag
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      // Si un onglet Carlow est déjà ouvert, on le focus et on navigue dedans.
      for (const c of clientsArr) {
        if (c.url.includes(self.location.host) && "focus" in c) {
          c.focus();
          if ("navigate" in c) {
            return c.navigate(target);
          }
          return;
        }
      }
      // Sinon nouvel onglet.
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    })
  );
});
