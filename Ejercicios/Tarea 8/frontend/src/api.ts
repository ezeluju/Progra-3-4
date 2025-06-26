// src/api.ts
const base = import.meta.env.VITE_API as string

export async function api<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}))
    // Zod pone los mensajes detallados en errors[0].message
    const detailed =
      errJson?.errors?.[0]?.message ||
      errJson?.message ||
      res.statusText
    throw new Error(detailed)
  }
  return res.json().catch(() => ({} as T))
}
