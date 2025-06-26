"use client"

import { createContext, useContext, useEffect, useState } from "react"

type ViewMode = "grid" | "list"

type ViewModeContextType = {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

const ViewModeContext = createContext<ViewModeContextType | null>(null)

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("grid")

  useEffect(() => {
    // Cargar desde cookies al inicializar
    const savedViewMode = document.cookie
      .split("; ")
      .find((row) => row.startsWith("viewMode="))
      ?.split("=")[1] as ViewMode

    if (savedViewMode && (savedViewMode === "grid" || savedViewMode === "list")) {
      setViewModeState(savedViewMode)
    }
  }, [])

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode)
    // Guardar en cookies
    document.cookie = `viewMode=${mode}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 año
    console.log("View mode saved to cookies:", mode)
  }

  return <ViewModeContext.Provider value={{ viewMode, setViewMode }}>{children}</ViewModeContext.Provider>
}

export function useViewMode() {
  const context = useContext(ViewModeContext)
  if (!context) {
    throw new Error("useViewMode must be used within ViewModeProvider")
  }
  return context
}
