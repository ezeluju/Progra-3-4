"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type DarkModeContextType = {
  isDark: boolean
  toggleDarkMode: (buttonElement?: HTMLElement) => void
  isTransitioning: boolean
}

const DarkModeContext = createContext<DarkModeContextType | null>(null)

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Cargar preferencia de dark mode desde cookies primero
    const savedDarkMode = document.cookie
      .split("; ")
      .find((row) => row.startsWith("darkMode="))
      ?.split("=")[1]

    let initialDarkMode = false

    if (savedDarkMode === "true") {
      initialDarkMode = true
    } else if (savedDarkMode === "false") {
      initialDarkMode = false
    } else {
      // Si no hay cookie, usar preferencia del sistema
      initialDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
    }

    console.log("Loading dark mode from cookies:", savedDarkMode, "-> using:", initialDarkMode)
    setIsDark(initialDarkMode)
    applyDarkMode(initialDarkMode)
    setIsInitialized(true)

    // Guardar en cookies si no existía
    if (!savedDarkMode) {
      document.cookie = `darkMode=${initialDarkMode}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 año
    }
  }, [])

  const applyDarkMode = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark")
      console.log("Applied dark mode")
    } else {
      document.documentElement.classList.remove("dark")
      console.log("Applied light mode")
    }
  }

  const toggleDarkMode = async (buttonElement?: HTMLElement) => {
    if (isTransitioning) return

    setIsTransitioning(true)
    const newDarkMode = !isDark

    console.log("Toggling dark mode from", isDark, "to", newDarkMode)

    // Guardar en cookies inmediatamente
    document.cookie = `darkMode=${newDarkMode}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 año

    // Crear animación de círculo expandiéndose
    const animationElement = document.createElement("div")

    // Obtener posición del botón si se proporciona
    let centerX = window.innerWidth / 2
    let centerY = window.innerHeight / 2

    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect()
      centerX = rect.left + rect.width / 2
      centerY = rect.top + rect.height / 2
    }

    // Calcular el radio necesario para cubrir toda la pantalla
    const maxRadius = Math.sqrt(
      Math.pow(Math.max(centerX, window.innerWidth - centerX), 2) +
        Math.pow(Math.max(centerY, window.innerHeight - centerY), 2),
    )

    animationElement.style.cssText = `
      position: fixed;
      top: ${centerY}px;
      left: ${centerX}px;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: ${newDarkMode ? "#030712" : "#f9fafb"};
      z-index: 9999;
      pointer-events: none;
      transform: translate(-50%, -50%);
      transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `

    document.body.appendChild(animationElement)

    // Iniciar animación
    requestAnimationFrame(() => {
      animationElement.style.width = `${maxRadius * 2}px`
      animationElement.style.height = `${maxRadius * 2}px`
    })

    // Cambiar el tema a la mitad de la animación
    setTimeout(() => {
      setIsDark(newDarkMode)
      applyDarkMode(newDarkMode)
      console.log("Dark mode preference saved to cookies:", newDarkMode)
    }, 300)

    // Limpiar
    setTimeout(() => {
      if (document.body.contains(animationElement)) {
        document.body.removeChild(animationElement)
      }
      setIsTransitioning(false)
    }, 700)
  }

  // No renderizar hasta que se inicialice
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 dark:border-red-400 border-t-red-600 dark:border-t-red-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando tema...</p>
        </div>
      </div>
    )
  }

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode, isTransitioning }}>{children}</DarkModeContext.Provider>
  )
}

export function useDarkMode() {
  const context = useContext(DarkModeContext)
  if (!context) {
    throw new Error("useDarkMode must be used within DarkModeProvider")
  }
  return context
}
