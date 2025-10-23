"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";

type MessageRole = "user" | "assistant" | "system";

const roleLabels: Record<MessageRole, string> = {
  user: "Tú",
  assistant: "Asistente",
  system: "Sistema",
};

export default function ChatPage() {
  const { messages, sendMessage, status, error } = useChat({
    id: "ejercicio-13-chatbot",
  });

  const listRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");

  const sendUserMessage = async (text: string) => {
    const value = text.trim();
    if (!value) return;
    try {
      await sendMessage({ text: value });
    } catch (err) {
      console.error("No fue posible enviar el mensaje:", err);
    }
  };

  // Keep the scroll anchored to the last message while streaming.
  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, status]);

  const chatHistory = useMemo(
    () =>
      messages
        .filter((message) => message.role !== "system")
        .map((message) => {
          const text =
            message.parts
              ?.map((part) => {
                if (part.type !== "text") {
                  return "";
                }
                return part.text ?? "";
              })
              .join("")
              .trim() ?? "";

          return {
            id: message.id,
            role: (message.role as MessageRole) ?? "assistant",
            text,
          };
        })
        .filter((message) => message.text.length > 0),
    [messages],
  );

  const isAwaitingResponse =
    status === "submitted" || status === "streaming";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim();
    if (!value) return;
    await sendUserMessage(value);
    setInput("");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold text-blue-600">
          Chatbot con OpenRouter
        </h1>
        <p className="text-sm text-gray-600">
          Envía tus preguntas. Las respuestas se generan en tiempo real usando el
          AI SDK de Vercel y un modelo gratuito de OpenRouter.
        </p>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div
          ref={listRef}
          className="flex-1 space-y-4 overflow-y-auto p-6"
          aria-live="polite"
        >
          {chatHistory.length === 0 ? (
            <EmptyState onExample={(question) => void sendUserMessage(question)} />
          ) : (
            chatHistory.map((message) => (
              <ChatMessage key={message.id} role={message.role} text={message.text} />
            ))
          )}

          {isAwaitingResponse ? <TypingIndicator /> : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error instanceof Error
                ? error.message
                : "Ocurrió un error al conectar con el modelo."}
            </div>
          ) : null}
        </div>

        <form
          className="border-t border-gray-200 bg-gray-50/80 p-4"
          onSubmit={onSubmit}
        >
          <label htmlFor="prompt" className="sr-only">
            Escribe tu mensaje
          </label>
          <div className="flex gap-3">
            <textarea
              id="prompt"
              name="prompt"
              rows={2}
              required
              maxLength={2000}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Haz una pregunta al asistente…"
              aria-label="Mensaje para el asistente"
            />
            <button
              type="submit"
              disabled={isAwaitingResponse || input.trim().length === 0}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function ChatMessage({ role, text }: { role: MessageRole; text: string }) {
  const isUser = role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} text-sm`}
      role="group"
      aria-label={`${roleLabels[role]} dice`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        <div className="mb-1 text-xs font-medium uppercase tracking-wide opacity-70">
          {roleLabels[role]}
        </div>
        <p className="whitespace-pre-line leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
      </span>
      Escribiendo…
    </div>
  );
}

function EmptyState({
  onExample,
}: {
  onExample: (question: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
      <p className="font-medium text-gray-700">
        Tu conversación aparecerá aquí. Algunas ideas para empezar:
      </p>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {[
          "Explícame qué es el APIs y cómo funcionan.",
          "Sugiere un plan de estudio de JavaScript para 4 semanas.",
          "Resume la diferencia entre SSR y SSG en Next.js.",
          "Dame consejos para mejorar la accesibilidad de un formulario.",
        ].map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              onClick={() => onExample(suggestion)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-left text-gray-700 transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
