"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Chatbot IA flottant pour la marketplace.
 *
 * - Bouton FAB (Floating Action Button) en bas à droite
 * - Panel de chat qui s'ouvre au clic
 * - Conversation maintenue côté client (state local)
 * - Appelle /api/ai/chatbot avec l'historique complet
 * - Affiche les produits recommandés par l'IA en cartes cliquables
 *
 * Pas de persistance entre les sessions (réinitialisé au reload). Pour
 * persistance, ajouter localStorage avec une clé "carlow-chat-history".
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  recommendations?: ProductRec[];
  timestamp: number;
}

interface ProductRec {
  id: string;
  name: string;
  price: number;
  category: string | null;
  imageUrl: string | null;
  vendor: string;
}

const SUGGESTED_QUESTIONS = [
  "Quels panneaux solaires me conseillez-vous ?",
  "Comment fonctionne le paiement sur Carlow ?",
  "Avez-vous des batteries de stockage ?",
  "Comment devenir vendeur ?",
];

function formatPrice(p: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(p);
}

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(true); // pulse au 1er affichage
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Bonjour 👋 Je suis l'assistant Carlow ! Je peux vous aider à trouver des équipements EnR, comparer des produits ou répondre à vos questions sur la marketplace. Que puis-je faire pour vous ?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en bas à chaque nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Retire le badge "nouveau" dès qu'on ouvre
  useEffect(() => {
    if (open) setHasNew(false);
  }, [open]);

  async function sendMessage(messageText: string) {
    const text = messageText.trim();
    if (!text || sending) return;

    setError("");
    const newUserMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    const updated = [...messages, newUserMsg];
    setMessages(updated);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Erreur lors de la conversation");
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          recommendations: data.recommendations ?? [],
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Bouton flottant */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir l'assistant IA"
          className="group fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] text-white shadow-[0_8px_24px_rgb(var(--primary)/0.45)] transition-all duration-200 hover:scale-110 hover:shadow-[0_10px_32px_rgb(var(--primary)/0.55)] sm:bottom-8 sm:right-8 sm:h-16 sm:w-16"
        >
          {hasNew && (
            <>
              <span className="absolute inset-0 rounded-full bg-[rgb(var(--primary))] opacity-50 animate-ping" />
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[rgb(var(--success))] text-[10px] font-bold text-white shadow-md">
                AI
              </span>
            </>
          )}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="relative h-6 w-6 transition-transform group-hover:rotate-12 sm:h-7 sm:w-7"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}

      {/* Panel chatbot */}
      {open && (
        <div className="fixed bottom-0 right-0 z-50 flex h-full w-full flex-col sm:bottom-6 sm:right-6 sm:h-[min(640px,90vh)] sm:w-[400px] animate-slide-up">
          {/* Backdrop mobile */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="relative ml-auto flex h-full w-full flex-col overflow-hidden rounded-none border border-[rgb(var(--border))]/70 bg-[rgb(var(--card))] shadow-2xl sm:h-full sm:max-w-[400px] sm:rounded-2xl">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] via-[#d96b20] to-[#b85514] px-5 py-4 text-white">
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
                    <span className="text-xl">🤖</span>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[rgb(var(--primary))] bg-[rgb(var(--success))]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">Assistant Carlow</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/80">
                      Propulsé par Claude IA
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="grid h-9 w-9 place-items-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-[rgb(var(--bg))]/40 to-[rgb(var(--card))] px-4 py-5"
            >
              {messages.map((m, i) => (
                <ChatBubble key={i} message={m} />
              ))}

              {sending && (
                <div className="flex items-end gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] text-white text-sm">
                    🤖
                  </div>
                  <div className="rounded-2xl rounded-bl-md bg-[rgb(var(--card))] border border-[rgb(var(--border))]/60 px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((j) => (
                        <span
                          key={j}
                          className="h-2 w-2 rounded-full bg-[rgb(var(--primary))]"
                          style={{
                            animation: "pulse-ring 1.2s ease-in-out infinite",
                            animationDelay: `${j * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 animate-fade-in">
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Suggestions (uniquement au démarrage) */}
            {messages.length === 1 && (
              <div className="border-t border-[rgb(var(--border))]/60 px-4 py-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                  💡 Suggestions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      disabled={sending}
                      className="rounded-full border border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/5 px-3 py-1 text-[11px] font-medium text-[rgb(var(--primary))] transition hover:bg-[rgb(var(--primary))]/10 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 border-t border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                disabled={sending}
                maxLength={500}
                className="h-10 flex-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/50 px-3.5 text-sm outline-none transition-all duration-150 placeholder:text-[rgb(var(--muted))]/60 focus:border-[rgb(var(--primary))]/50 focus:bg-[rgb(var(--card))] focus:ring-3 focus:ring-[rgb(var(--primary))]/12 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] text-white shadow-sm transition-all duration-150",
                  "hover:scale-105 hover:shadow-md",
                  "disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                )}
                aria-label="Envoyer le message"
              >
                {sending ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="border-t border-[rgb(var(--border))]/40 bg-[rgb(var(--bg))]/40 px-4 py-2">
              <p className="text-center text-[9px] text-[rgb(var(--muted))]">
                Conversations IA — peut faire des erreurs. Vérifiez les infos critiques.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Bulle de message ---------------- */

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  // Formate le texte : transforme **text** en <strong>
  function formatContent(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-[rgb(var(--primary))]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div
      className={cn(
        "flex items-end gap-2 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] text-white text-sm">
          🤖
        </div>
      )}
      {isUser && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[rgb(var(--success))] to-emerald-600 text-white text-sm">
          👤
        </div>
      )}

      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-md bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] text-white"
            : "rounded-bl-md border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
        )}
      >
        <p className="whitespace-pre-line">{formatContent(message.content)}</p>

        {/* Cartes produits recommandés */}
        {message.recommendations && message.recommendations.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-black/10 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              📦 Produits suggérés
            </p>
            {message.recommendations.map((p) => (
              <Link
                key={p.id}
                href={`/marketplace/${p.id}`}
                className="group flex items-center gap-2.5 rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] p-2 text-[rgb(var(--fg))] transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgb(var(--primary))]/40 hover:shadow-md"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[rgb(var(--bg))]">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-lg text-[rgb(var(--muted))]/40">
                      📦
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{p.name}</p>
                  <p className="truncate text-[10px] text-[rgb(var(--muted))]">
                    {p.vendor}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-[rgb(var(--primary))]">
                    {formatPrice(p.price)}
                  </p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-[rgb(var(--muted))] transition group-hover:translate-x-0.5 group-hover:text-[rgb(var(--primary))]">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
