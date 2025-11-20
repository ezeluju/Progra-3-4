import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Book Advisor',
  description: 'Conversational reading companion powered by the Vercel AI SDK and Google Books.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
        <main className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
          <header className="rounded-3xl border border-indigo-900/60 bg-slate-900/70 p-6 shadow-2xl shadow-indigo-900/40 ring-1 ring-indigo-700/40 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">Ejercicio 13 · Parte 2A</p>
                <h1 className="text-3xl font-bold text-white">AI Book Advisor</h1>
                <p className="max-w-2xl text-sm text-slate-300">
                  Asistente conversacional con IA + tool calling para buscar en Google Books, gestionar listas y generar
                  estadísticas persistidas en base de datos. Todo el acceso a claves vive en el backend con validación y rate
                  limiting.
                </p>
              </div>
              <div className="flex flex-col gap-2 text-xs text-slate-200">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 font-semibold text-emerald-200 ring-1 ring-emerald-500/40">
                  ✅ Seguridad: claves solo en backend
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-4 py-2 font-semibold text-indigo-100 ring-1 ring-indigo-400/60">
                  🛠️ 6 herramientas listas para tool calling
                </span>
              </div>
            </div>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}