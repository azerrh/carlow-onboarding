"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/**
 * Chat de commande — composant unifié pour buyer ET vendor.
 *
 * - Polling toutes les 8s pour récupérer les nouveaux messages (pas de
 *   WebSocket pour simplifier — on accepte un délai de quelques secondes).
 * - Marque automatiquement les messages reçus comme lus à l'ouverture.
 * - Auto-scroll vers le bas à chaque nouveau message.
 * - Distingue visuellement "moi" vs "l'autre" via authorType.
 *
 * Note : on identifie l'expéditeur par localStorage côté client (cohérent
 * avec le reste de l'app). Le serveur revérifie systématiquement.
 */

interface Message {
  id: string;
  authorType: "BUYER" | "VENDOR";
  authorName: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

const POLL_MS = 8000;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderChat({
  orderId,
  as,
  userId,
}: {
  orderId: string;
  as: "buyer" | "vendor";
  userId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadOther, setUnreadOther] = useState(0);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const meType = as === "buyer" ? "BUYER" : "VENDOR";

  const fetchMessages = useCallback(async () => {
    try {
      const url = `/api/orders/${orderId}/messages?as=${as}&userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.messages ?? []);
        setUnreadOther(data.unreadCount ?? 0);
      } else if (res.status === 403) {
        setError("Vous n'avez pas accès à cette conversation.");
      }
    } catch {
      // silencieux — le poll suivant retentera
    } finally {
      setLoading(false);
    }
  }, [orderId, as, userId]);

  // Marque les messages reçus comme lus.
  const markAsRead = useCallback(async () => {
    try {
      await fetch(`/api/orders/${orderId}/messages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ as, userId }),
      });
      setUnreadOther(0);
    } catch {
      // silencieux
    }
  }, [orderId, as, userId]);

  // Premier chargement + marquage lu
  useEffect(() => {
    fetchMessages().then(() => {
      void markAsRead();
    });
  }, [fetchMessages, markAsRead]);

  // Polling régulier
  useEffect(() => {
    const interval = setInterval(fetchMessages, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll bas
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // Si on revient à l'onglet et qu'il y a des non-lus, on re-fetch + mark.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") {
        fetchMessages().then(() => {
          if (unreadOther > 0) void markAsRead();
        });
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetchMessages, markAsRead, unreadOther]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setSending(true);
    setError("");

    // Optimistic update : on affiche le message immédiatement avec un ID
    // temporaire. Si l'API échoue, on retire.
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      authorType: meType,
      authorName: "Vous",
      content: trimmed,
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorType: meType,
          authorId: userId,
          content: trimmed,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Erreur d'envoi");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(trimmed); // restitue le brouillon
        return;
      }
      // Remplace le message optimiste par celui retourné par l'API.
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? (data.message as Message) : m))
      );
    } catch {
      setError("Erreur réseau.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <header className="border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Messagerie de commande</p>
            <p className="text-[11px] text-[rgb(var(--muted))]">
              Échange direct entre acheteur et vendeur — visible des deux côtés.
            </p>
          </div>
          {unreadOther > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {unreadOther} nouveau{unreadOther > 1 ? "x" : ""}
            </span>
          )}
        </div>
      </header>

      {/* Zone messages — hauteur fixe avec scroll interne */}
      <div className="max-h-96 min-h-[280px] overflow-y-auto bg-[rgb(var(--bg))]/40 px-4 py-4 sm:px-5">
        {loading ? (
          <p className="py-8 text-center text-xs text-[rgb(var(--muted))]">
            Chargement…
          </p>
        ) : error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center">
            <div className="text-2xl">💬</div>
            <p className="mt-2 text-sm font-semibold">Aucun message</p>
            <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
              Démarrez la conversation pour poser une question sur cette commande.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              const isMe = m.authorType === meType;
              return (
                <li
                  key={m.id}
                  className={cn(
                    "flex flex-col gap-1",
                    isMe ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                      isMe
                        ? "rounded-br-sm bg-[rgb(var(--primary))] text-[rgb(var(--primary-contrast))]"
                        : "rounded-bl-sm bg-[rgb(var(--card))] text-[rgb(var(--fg))] border border-[rgb(var(--border))]"
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                  <span className="px-1 text-[10px] text-[rgb(var(--muted))]">
                    {isMe ? "Vous" : m.authorName} · {formatTime(m.createdAt)}
                  </span>
                </li>
              );
            })}
            <div ref={endRef} />
          </ul>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 sm:p-4"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as unknown as React.FormEvent);
            }
          }}
          rows={2}
          maxLength={5000}
          placeholder="Écrivez votre message… (Entrée pour envoyer, Maj+Entrée pour ligne)"
          className="flex-1 resize-none rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm focus:border-[rgb(var(--primary))]/60 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
        />
        <Button type="submit" size="sm" disabled={sending || !input.trim()}>
          {sending ? "…" : "Envoyer"}
        </Button>
      </form>
    </Card>
  );
}
