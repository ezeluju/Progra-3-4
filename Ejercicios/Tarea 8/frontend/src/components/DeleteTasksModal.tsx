"use client"

import { useState } from "react"
import { XMarkIcon, ExclamationTriangleIcon, TrashIcon } from "@heroicons/react/24/outline"

interface DeleteTasksModalProps {
  isOpen: boolean
  taskCount: number
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function DeleteTasksModal({ isOpen, taskCount, onClose, onConfirm }: DeleteTasksModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error("Error deleting tasks:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800 transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirmar eliminación</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              ¿Eliminar {taskCount} tarea{taskCount > 1 ? "s" : ""} completada{taskCount > 1 ? "s" : ""}?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Esta acción no se puede deshacer. Se eliminarán permanentemente todas las tareas marcadas como completadas.
            </p>
          </div>

          {/* Warning box */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2 text-sm text-red-800 dark:text-red-300">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
              <span>
                Se eliminarán <strong>{taskCount}</strong> tarea{taskCount > 1 ? "s" : ""} completada{taskCount > 1 ? "s" : ""} de forma permanente
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-medium hover:from-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4" />
                  <span>Eliminar {taskCount > 1 ? "tareas" : "tarea"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
