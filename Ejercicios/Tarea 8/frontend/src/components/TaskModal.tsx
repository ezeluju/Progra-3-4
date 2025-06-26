"use client"

import { useState } from "react"
import { XMarkIcon, PencilIcon, CheckIcon } from "@heroicons/react/24/outline"
import { UserIcon, CalendarIcon } from "@heroicons/react/24/solid"
import { api } from "../api"

interface Props {
  task: {
    id: number
    title: string
    content?: string
    completed: boolean
    creator?: {
      id: number
      name: string
      email: string
    }
  }
  onClose: () => void
  onUpdate: () => void
  boardId: number
  canEdit: boolean
}

export default function TaskModal({ task, onClose, onUpdate, boardId, canEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editContent, setEditContent] = useState(task.content || "")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!editTitle.trim()) return

    setIsSaving(true)
    try {
      await api(`/boards/${boardId}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle,
          content: editContent || undefined,
        }),
      })

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error("Error updating task:", error)
      alert("Error al actualizar la tarea")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditTitle(task.title)
    setEditContent(task.content || "")
    setIsEditing(false)
  }

  const formatContent = (content: string) => {
    if (!content) return ""

    // Formateo básico de markdown con mejor manejo de código
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-sm font-mono border"><code>$1</code></pre>',
      )
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/\n/g, "<br>")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                task.completed
                  ? "bg-gradient-to-br from-green-500 to-green-600"
                  : "bg-gradient-to-br from-orange-500 to-red-600"
              }`}
            >
              <CheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Detalles de la tarea</h3>
              <p
                className={`text-sm ${
                  task.completed ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
                }`}
              >
                {task.completed ? "Completada" : "Pendiente"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                title="Editar tarea"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {isEditing ? (
            /* Modo edición */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Título de la tarea..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                  placeholder="Descripción de la tarea..."
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Tip: Usa **negrita**, *cursiva*, `código`
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{editContent.length}/500</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={!editTitle.trim() || isSaving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CheckIcon className="w-4 h-4" />
                  )}
                  <span>Guardar</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* Modo visualización */
            <div className="space-y-6">
              {/* Título */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{task.title}</h2>
              </div>

              {/* Metadatos */}
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                {task.creator && (
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4" />
                    <span>Creado por {task.creator.name}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Estado: {task.completed ? "Completada" : "Pendiente"}</span>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Descripción</h3>
                {task.content ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    dangerouslySetInnerHTML={{ __html: formatContent(task.content) }}
                  />
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    No hay descripción para esta tarea.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
