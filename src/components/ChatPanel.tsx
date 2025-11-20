'use client';

import { useChat } from 'ai/react';
import { FormEvent, useEffect, useMemo, useRef } from 'react';

const roleLabel: Record<string, string> = {
  user: 'Tú',
  assistant: 'Asistente',
  system: 'Sistema',
  tool: 'Tool',
};

export function ChatPanel() {
  const { messages, handleSubmit, handleInputChange, input, isLoading, stop, setInput } = useChat({ api: '/api/chat' });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const friendlyMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        displayName: roleLabel[message.role] || message.role,
      })),
    [messages],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;
    handleSubmit(event);
  };

  const quickPrompts = [
    {
      label: 'Añadir libro (tool)',
      prompt: 'Agrega “Project Hail Mary” con prioridad alta y nota: revisar en grupo de lectura',
    },
    {
      label: 'Buscar y resumir',
      prompt: 'Busca en Google Books novelas de misterio y añade las dos mejores al dashboard de lectura',
    },
  ];

  const roleBorders: Record<string, string> = {
    user: 'border-slate-700',
    assistant: 'border-indigo-500/60',
    system: 'border-amber-500/60',
    tool: 'border-emerald-500/60',
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/50 ring-1 ring-indigo-800/40 backdrop-blur">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Chat</p>
          <h2 className="text-xl font-bold text-white">Recomendaciones en tiempo real</h2>
          <p className="text-sm text-slate-300">Comparte lo que quieres leer y el asistente buscará opciones.</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-slate-300">
          <span className="rounded-full bg-slate-800 px-3 py-1 font-semibold text-slate-100 ring-1 ring-slate-600">/api/chat</span>
          {isLoading ? (
            <span className="rounded-full bg-amber-500/20 px-3 py-1 font-semibold text-amber-200 ring-1 ring-amber-400/50">Ejecutando tools…</span>
          ) : (
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-200 ring-1 ring-emerald-500/40">Listo</span>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="h-[420px] space-y-3 overflow-y-auto rounded-2xl bg-slate-900/70 p-3 ring-1 ring-slate-800">
        {friendlyMessages.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-300">
            Pide recomendaciones por género, autor o estado de ánimo. El asistente puede buscar en Google Books, guardar libros,
            marcar como leídos y calcular estadísticas.
          </div>
        )}

        {friendlyMessages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col gap-2 rounded-xl border-2 bg-slate-900/80 p-3 shadow-lg shadow-black/30 ${roleBorders[message.role] || 'border-slate-700'}`}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              <span className="rounded bg-slate-200 px-2 py-1 text-slate-900">{message.displayName}</span>
              <span className="rounded bg-slate-800 px-2 py-1 text-slate-100">{message.role}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{message.content}</p>
          </div>
        ))}
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-slate-200" htmlFor="message">
          Escribe tu consulta
        </label>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setInput(item.prompt);
                queueMicrotask(() => formRef.current?.requestSubmit());
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/60 transition hover:-translate-y-0.5 hover:bg-indigo-500"
              disabled={isLoading}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-inner shadow-black/40">
          <textarea
            id="message"
            name="message"
            value={input}
            onChange={(event) => {
              const sanitized = event.target.value.slice(0, 800);
              if (sanitized !== event.target.value) {
                event.target.value = sanitized;
              }
              handleInputChange(event);
            }}
            className="min-h-[90px] w-full resize-none rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Ej. Recomiéndame novelas de ciencia ficción optimistas y guárdalas con prioridad alta"
            required
            maxLength={800}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span>Las peticiones se gestionan directamente en el backend</span>
            <div className="flex items-center gap-2">
              {isLoading && (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
                >
                  Detener
                </button>
              )}
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/60 transition hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
                disabled={isLoading}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
