"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  PlusIcon,
  UserPlusIcon,
  TrashIcon,
  CogIcon,
  ShareIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline"

// Agregar al inicio del archivo, después de los imports
import { api } from "../api"

type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  icon?: React.ComponentType<{ className?: string }>
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  updateNotificationPreference: (enabled: boolean) => void
  // Métodos específicos para nuestros casos
  showBoardCreated: (boardName: string) => void
  showTaskAdded: (taskTitle: string) => void
  showNewTaskReceived: (taskTitle: string, creatorName: string) => void
  showPreferencesSaved: () => void
  showBoardShared: (email: string) => void
  showPermissionChanged: (email: string, role: string) => void
  showUserRemoved: (email: string) => void
  showTaskDeleted: (taskTitle: string) => void
  showBoardDeleted: (boardName: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null)

// Modificar el ToastProvider para incluir verificación de preferencias
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  // Cargar preferencias de notificaciones
  useEffect(() => {
    api("/preferences")
      .then((prefs: any) => {
        setNotificationsEnabled(prefs?.notifications !== false)
      })
      .catch(() => {
        setNotificationsEnabled(true) // Default a true si no se pueden cargar
      })
  }, [])

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      // Solo mostrar toast si las notificaciones están habilitadas
      if (!notificationsEnabled) return

      const id = Math.random().toString(36).substr(2, 9)
      const newToast = { ...toast, id }

      setToasts((prev) => [...prev, newToast])

      // Auto remove after duration
      const duration = toast.duration || 4000
      setTimeout(() => {
        removeToast(id)
      }, duration)
    },
    [notificationsEnabled],
  )

  // Agregar método para actualizar preferencias de notificaciones
  const updateNotificationPreference = useCallback((enabled: boolean) => {
    setNotificationsEnabled(enabled)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Métodos específicos
  const showBoardCreated = useCallback(
    (boardName: string) => {
      addToast({
        type: "success",
        title: "¡Tablero creado!",
        message: `"${boardName}" se creó exitosamente`,
        icon: ClipboardDocumentListIcon,
      })
    },
    [addToast],
  )

  const showTaskAdded = useCallback(
    (taskTitle: string) => {
      addToast({
        type: "success",
        title: "Tarea añadida",
        message: `"${taskTitle}" se agregó al tablero`,
        icon: PlusIcon,
      })
    },
    [addToast],
  )

  const showNewTaskReceived = useCallback(
    (taskTitle: string, creatorName: string) => {
      addToast({
        type: "info",
        title: "Nueva tarea recibida",
        message: `${creatorName} agregó: "${taskTitle}"`,
        icon: InformationCircleIcon,
        duration: 6000, // Más tiempo para tareas recibidas
      })
    },
    [addToast],
  )

  const showPreferencesSaved = useCallback(() => {
    addToast({
      type: "success",
      title: "Preferencias guardadas",
      message: "Tus cambios se guardaron correctamente",
      icon: CogIcon,
    })
  }, [addToast])

  const showBoardShared = useCallback(
    (email: string) => {
      addToast({
        type: "success",
        title: "Tablero compartido",
        message: `Invitación enviada a ${email}`,
        icon: ShareIcon,
      })
    },
    [addToast],
  )

  const showPermissionChanged = useCallback(
    (email: string, role: string) => {
      const roleText = role === "EDITOR" ? "Editor" : "Solo lectura"
      addToast({
        type: "info",
        title: "Permisos actualizados",
        message: `${email} ahora es ${roleText}`,
        icon: UserPlusIcon,
      })
    },
    [addToast],
  )

  const showUserRemoved = useCallback(
    (email: string) => {
      addToast({
        type: "warning",
        title: "Usuario removido",
        message: `${email} ya no tiene acceso al tablero`,
        icon: TrashIcon,
      })
    },
    [addToast],
  )

  const showTaskDeleted = useCallback(
    (taskTitle: string) => {
      addToast({
        type: "warning",
        title: "Tarea eliminada",
        message: `"${taskTitle}" se eliminó del tablero`,
        icon: TrashIcon,
      })
    },
    [addToast],
  )

  const showBoardDeleted = useCallback(
  (boardName: string) => {
    addToast({
      type: "error",
      title: "Tablero eliminado",
      message: `"${boardName}" fue eliminado exitosamente`,
      icon: TrashIcon,
    });
  },
  [addToast],
);

  // Agregar updateNotificationPreference al context value
  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        updateNotificationPreference,
        showBoardCreated,
        showTaskAdded,
        showNewTaskReceived,
        showPreferencesSaved,
        showBoardShared,
        showPermissionChanged,
        showUserRemoved,
        showTaskDeleted,
        showBoardDeleted,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200"
      case "info":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
      default:
        return "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200"
    }
  }

  const getIconColor = () => {
    switch (toast.type) {
      case "success":
        return "text-green-600 dark:text-green-400"
      case "error":
        return "text-red-600 dark:text-red-400"
      case "warning":
        return "text-yellow-600 dark:text-yellow-400"
      case "info":
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  const IconComponent =
    toast.icon ||
    (() => {
      switch (toast.type) {
        case "success":
          return CheckCircleIcon
        case "error":
          return ExclamationTriangleIcon
        case "warning":
          return ExclamationTriangleIcon
        case "info":
          return InformationCircleIcon
        default:
          return InformationCircleIcon
      }
    })()

  return (
    <div
      className={`
        ${getToastStyles()}
        border rounded-xl p-4 shadow-lg backdrop-blur-sm
        transform transition-all duration-300 ease-in-out
        animate-in slide-in-from-right-full
        hover:scale-105 cursor-pointer
      `}
      onClick={() => onRemove(toast.id)}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toast.title}</p>
          {toast.message && <p className="text-sm opacity-90 mt-1">{toast.message}</p>}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(toast.id)
          }}
          className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
