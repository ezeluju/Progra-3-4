"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { api } from "./api"

type User = { id: number; email: string; name: string }
interface AuthCtx {
  user: User | null
  loading: boolean
  login: (e: string, p: string) => Promise<void>
  register: (e: string, n: string, p: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null as never)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLd] = useState(true)

  // Test session on mount by getting actual user data
  useEffect(() => {
    api<User>("/auth/me")
      .then((userData) => {
        setUser(userData)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLd(false)
      })
  }, [])

  const login = async (email: string, password: string) => {
    const u = await api<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    setUser(u)
  }

  const register = async (email: string, name: string, password: string) => {
    const u = await api<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    })
    setUser(u)
  }

  const logout = async () => {
    await api("/auth/logout", { method: "POST" })
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading: loading, login, register, logout }}>{children}</Ctx.Provider>
}
