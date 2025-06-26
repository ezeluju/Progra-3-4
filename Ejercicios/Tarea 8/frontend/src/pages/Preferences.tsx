"use client"

import { useEffect, useState, useRef } from "react"
import { api } from "../api"
import { useDarkMode } from "../hooks/useDarkMode"
import { useViewMode } from "../hooks/useViewMode"
import { useToast } from "../hooks/useToast"
import {
  CogIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ClockIcon,
  BellIcon,
  CheckIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline"

type Preferences = {
  autoRefreshInterval: number
  notifications: boolean
}

export default function Preferences() {
  const { isDark, toggleDarkMode, isTransitioning } = useDarkMode()
  const { viewMode, setViewMode } = useViewMode()
  const { showPreferencesSaved, updateNotificationPreference } = useToast()
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const [prefs, setPrefs] = useState<Preferences>({
    autoRefreshInterval: 30,
    notifications: true,
  })
  const [originalPrefs, setOriginalPrefs] = useState<Preferences>({
    autoRefreshInterval: 30,
    notifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api<Preferences>("/preferences")
      .then((data) => {
        const prefsWithDefaults = {
          autoRefreshInterval: data.autoRefreshInterval || 30,
          notifications: data.notifications !== undefined ? data.notifications : true,
        }
        setPrefs(prefsWithDefaults)
        setOriginalPrefs(prefsWithDefaults)
      })
      .catch(() => {
        const defaultPrefs = {
          autoRefreshInterval: 30,
          notifications: true,
        }
        setPrefs(defaultPrefs)
        setOriginalPrefs(defaultPrefs)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const savePreferences = async () => {
    setSaving(true)
    try {
      await api("/preferences", {
        method: "PUT",
        body: JSON.stringify(prefs),
      })

      // Actualizar el contexto de toast con la nueva preferencia
      updateNotificationPreference(prefs.notifications)

      setOriginalPrefs(prefs)
      setSaved(true)

      // 🎉 Toast notification (solo si las notificaciones están habilitadas)
      if (prefs.notifications) {
        showPreferencesSaved()
      }

      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleDarkModeToggle = () => {
    toggleDarkMode(toggleButtonRef.current || undefined)
  }

  const handleNotificationToggle = () => {
    const newNotificationState = !prefs.notifications
    setPrefs({ ...prefs, notifications: newNotificationState })

    // Actualizar inmediatamente el contexto para que el usuario vea el cambio
    updateNotificationPreference(newNotificationState)
  }

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(originalPrefs)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 dark:border-red-400 border-t-red-600 dark:border-t-red-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando preferencias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <CogIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-yellow-600 dark:from-red-400 dark:to-yellow-400 bg-clip-text text-transparent">
              Preferencias
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">Personaliza tu experiencia en TaskFlow</p>
        </div>

        {/* Save Status */}
        {saved && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl flex items-center space-x-2 animate-pulse">
            <CheckIcon className="w-5 h-5" />
            <span>Preferencias guardadas correctamente</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Dark Mode */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isDark ? (
                  <MoonIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                ) : (
                  <SunIcon className="w-6 h-6 text-yellow-600" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tema</h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Cambia entre tema claro y oscuro (se guarda automáticamente)
                  </p>
                </div>
              </div>

              <button
                ref={toggleButtonRef}
                onClick={handleDarkModeToggle}
                disabled={isTransitioning}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 ${
                  isDark
                    ? "bg-gradient-to-r from-orange-600 to-red-600"
                    : "bg-gradient-to-r from-yellow-400 to-orange-500"
                } ${isTransitioning ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"}`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
                    isDark ? "translate-x-9" : "translate-x-1"
                  }`}
                >
                  <div className="flex items-center justify-center h-full">
                    {isDark ? (
                      <MoonIcon className="w-3 h-3 text-orange-600" />
                    ) : (
                      <SunIcon className="w-3 h-3 text-yellow-600" />
                    )}
                  </div>
                </span>
              </button>
            </div>
          </div>

          {/* View Mode */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <Squares2X2Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Modo de Visualización</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Elige cómo quieres ver tus tableros (se guarda automáticamente)
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Grid Option */}
              <button
                onClick={() => setViewMode("grid")}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                  viewMode === "grid"
                    ? "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 shadow-lg"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-red-300 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-colors duration-200 ${
                      viewMode === "grid"
                        ? "bg-gradient-to-br from-red-500 to-yellow-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <Squares2X2Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Vista en Cuadrícula</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Los tableros se muestran en tarjetas organizadas en una cuadrícula
                  </p>

                  {/* Preview */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="h-8 bg-gradient-to-br from-red-400 to-yellow-500 rounded-lg opacity-60"></div>
                    <div className="h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg opacity-60"></div>
                    <div className="h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg opacity-60"></div>
                    <div className="h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg opacity-60"></div>
                  </div>
                </div>
              </button>

              {/* List Option */}
              <button
                onClick={() => setViewMode("list")}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                  viewMode === "list"
                    ? "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 shadow-lg"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-red-300 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                }`}
              >
                <div className="text-center">
                  <div
                    className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-colors duration-200 ${
                      viewMode === "list"
                        ? "bg-gradient-to-br from-red-500 to-yellow-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <ListBulletIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Vista en Lista</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Los tableros se muestran en una lista vertical detallada
                  </p>

                  {/* Preview */}
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-gradient-to-r from-red-400 to-yellow-500 rounded-lg opacity-60"></div>
                    <div className="h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg opacity-60"></div>
                    <div className="h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg opacity-60"></div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Auto Refresh */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <ClockIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Actualización Automática</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Configura cada cuántos segundos se actualizan las tareas automáticamente
            </p>

            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={prefs.autoRefreshInterval}
                onChange={(e) => setPrefs({ ...prefs, autoRefreshInterval: Number(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer slider-custom"
              />
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-3 py-1 rounded-xl font-medium min-w-[80px] text-center">
                {prefs.autoRefreshInterval}s
              </div>
            </div>

            <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>1s (Rápido)</span>
              <span>30s (Lento)</span>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BellIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Notificaciones</h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Recibe notificaciones sobre cambios en tus tableros
                  </p>
                </div>
              </div>

              <button
                onClick={handleNotificationToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  prefs.notifications ? "bg-gradient-to-r from-red-600 to-yellow-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    prefs.notifications ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button - Fixed at bottom */}
        {hasChanges && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 dark:text-gray-300">Tienes cambios sin guardar</div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setPrefs(originalPrefs)
                      updateNotificationPreference(originalPrefs.notifications)
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={savePreferences}
                    disabled={saving}
                    className="bg-gradient-to-r from-red-600 to-yellow-600 dark:from-red-500 dark:to-yellow-500 text-white px-6 py-2 rounded-xl font-medium hover:from-red-700 hover:to-yellow-700 dark:hover:from-red-600 dark:hover:to-yellow-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                    <span>Guardar Cambios</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS for slider */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .slider-custom::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: linear-gradient(45deg, #dc2626, #f59e0b);
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .slider-custom::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: linear-gradient(45deg, #dc2626, #f59e0b);
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        `,
        }}
      />
    </div>
  )
}
