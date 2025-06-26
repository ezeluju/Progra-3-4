"use client"

import { useEffect, useState } from "react"
import { api } from "../api"
import { useToast } from "../hooks/useToast"
import { useAuth } from "../auth"
import {
  XMarkIcon,
  UserPlusIcon,
  UserIcon,
  StarIcon,
  PencilIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline"

// =====================
// Tipos
// =====================

type ShareItem = {
  userId: number
  email: string
  role: "OWNER" | "EDITOR" | "VIEWER"
}

interface Props {
  boardId: number
  onClose: () => void
}

export default function ShareModal({ boardId, onClose }: Props) {
  const [list, setList] = useState<ShareItem[]>([])
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("VIEWER")
  const [loading, setLoading] = useState(false)

  // 👉 Traemos addToast para usarlo con errores puntuales
  const { addToast, showBoardShared, showPermissionChanged, showUserRemoved } = useToast()
  const { user } = useAuth()

  // ---------------------
  // Helpers
  // ---------------------
  const load = () => api<ShareItem[]>(`/boards/${boardId}/share`).then(setList)

  useEffect(() => {
    load()
  }, [boardId])

  const changeRole = async (userId: number, newRole: ShareItem["role"]) => {
    const user = list.find((u) => u.userId === userId)
    if (!user) return

    await api(`/boards/${boardId}/share/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    })

    // 🎉 Toast notification
    showPermissionChanged(user.email, newRole)

    load()
  }

  const removeUser = async (userId: number) => {
    const user = list.find((u) => u.userId === userId)
    if (!user) return

    await api(`/boards/${boardId}/share/${userId}`, { method: "DELETE" })

    // 🎉 Toast notification
    showUserRemoved(user.email)

    load()
  }

  const addUser = async () => {
    if (!email.trim()) return

    // 2) Bloquear auto-invitación
    if (email.toLowerCase() === user?.email.toLowerCase()) {
      addToast({
        type: "warning",
        title: "No puedes compartirte a ti mismo!",
        icon: ExclamationTriangleIcon,
        })
        return
      }

    // Si ya existe en la lista actual evitamos ir a la API
    if (list.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      addToast({
        type: "info",
        title: "Usuario ya invitado",
        message: `${email} ya es miembro del tablero`,
        icon: InformationCircleIcon,
      })
      return
    }

    setLoading(true)
    try {
      await api(`/boards/${boardId}/share`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      })

      // 🎉 Toast notification éxito
      showBoardShared(email)

      setEmail("")
      load()
    } catch (err: any) {
      // Dependiendo de cómo responda tu API ajusta los códigos / mensajes
      const status = err?.status || err?.response?.status
      if (status === 404) {
        addToast({
          type: "error",
          title: "Usuario no encontrado",
          message: `No existe una cuenta con el correo ${email}`,
          icon: ExclamationTriangleIcon,
        })
      } else if (status === 409) {
        // 409 → Conflicto: ya invitado (por si la API lo envía así)
        addToast({
          type: "warning",
          title: "Ya invitado",
          message: `${email} ya tenía acceso al tablero`,
          icon: InformationCircleIcon,
        })
      } else {
        addToast({
          type: "error",
          title: "Error al compartir",
          message: err?.message || "No se pudo compartir el tablero. Intenta de nuevo.",
          icon: ExclamationTriangleIcon,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // ---------------------
  // UI helpers
  // ---------------------
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <StarIcon className="w-4 h-4 text-yellow-600" />
      case "EDITOR":
        return <PencilIcon className="w-4 h-4 text-red-600" />
      case "VIEWER":
        return <EyeIcon className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      OWNER: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
      EDITOR: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800",
      VIEWER: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    }

    const labels = {
      OWNER: "Propietario",
      EDITOR: "Editor",
      VIEWER: "Solo lectura",
    }

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[role as keyof typeof styles]}`}>{getRoleIcon(role)}<span>{labels[role as keyof typeof labels]}</span>      </span>
    )
  }

  // =====================
  // Render
  // =====================
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Compartir Tablero</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Add User Form */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invitar por email</label>
              <input
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="usuario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addUser()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permisos</label>
              <select
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="VIEWER">Solo lectura</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>

            <button
              onClick={addUser}
              disabled={loading || !email.trim()}
              className="w-full bg-gradient-to-r from-red-600 to-yellow-600 text-white py-3 px-4 rounded-xl font-medium hover:from-red-700 hover:to-yellow-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlusIcon className="w-5 h-5" />
                  <span>Invitar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Miembros del tablero ({list.length})</h3>

          {list.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {list.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
                      {getRoleBadge(user.role)}
                    </div>
                  </div>

                  {user.role !== "OWNER" && (
                    <div className="flex items-center space-x-2">
                      <select
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        value={user.role}
                        onChange={(e) => changeRole(user.userId, e.target.value as any)}
                      >
                        <option value="VIEWER">Solo lectura</option>
                        <option value="EDITOR">Editor</option>
                      </select>
                      <button
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-200"
                        onClick={() => removeUser(user.userId)}
                        title="Remover usuario"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <UserIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p>No hay miembros aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
