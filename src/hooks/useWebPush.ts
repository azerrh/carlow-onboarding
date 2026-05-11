"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook pour activer/désactiver les Web Push notifications pour un user.
 *
 * Flow :
 *  1. checkSupport() : vérifie que le navigateur supporte SW + Push API
 *  2. register() : enregistre /sw.js + demande la permission + souscrit
 *     auprès du serveur push via la clé VAPID publique
 *  3. unregister() : se désabonne côté navigateur + côté serveur
 *
 * Source de vérité = le navigateur (pushManager.getSubscription).
 * Le state local `enabled` est synchronisé au mount.
 */

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Permission = "default" | "granted" | "denied" | "unsupported";

/**
 * Convertit la clé VAPID en BufferSource attendu par pushManager.subscribe.
 * On retourne explicitement un Uint8Array typé sur ArrayBuffer (non Shared),
 * sinon TS 5.x se plaint sur le widening de ArrayBufferLike.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}

export function useWebPush(
  user: { vendorId?: string; buyerId?: string } | null
) {
  const [permission, setPermission] = useState<Permission>("default");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Détection support + état initial
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      setLoading(false);
      return;
    }
    setPermission(Notification.permission);
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user || (!user.vendorId && !user.buyerId)) return false;
    if (!VAPID_PUBLIC) {
      console.error("[useWebPush] NEXT_PUBLIC_VAPID_PUBLIC_KEY manquant");
      return false;
    }
    setBusy(true);
    try {
      // 1) Enregistre le SW (idempotent)
      const reg = await navigator.serviceWorker.register("/sw.js");

      // 2) Demande la permission (popup natif)
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      // 3) Souscrit auprès du push service
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      // 4) Envoie au backend pour qu'il puisse push à ce device
      const payload = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: payload,
          vendorId: user.vendorId,
          buyerId: user.buyerId,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
      });
      if (!res.ok) throw new Error("API subscribe failed");
      setEnabled(true);
      return true;
    } catch (error) {
      console.error("[useWebPush] subscribe error:", error);
      return false;
    } finally {
      setBusy(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch(
          `/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`,
          { method: "DELETE" }
        );
      }
      setEnabled(false);
    } catch (error) {
      console.error("[useWebPush] unsubscribe error:", error);
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    supported: permission !== "unsupported",
    permission,
    enabled,
    loading,
    busy,
    subscribe,
    unsubscribe,
  };
}
