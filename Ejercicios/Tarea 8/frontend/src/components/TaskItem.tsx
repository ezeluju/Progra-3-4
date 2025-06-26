"use client"

import type React from "react"

import { CheckIcon, TrashIcon, UserIcon } from "@heroicons/react/24/solid"
import { CheckIcon as CheckOutline } from "@heroicons/react/24/outline"
import { useState } from "react"

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
  showCreator?: boolean
  onClick?: () => void
  onToggle?: () => Promise<void>
  onDelete?: () => Promise<void>
}

export default function TaskItem({ task, showCreator = false, onClick, onToggle, onDelete }: Props) {
  const [isToggling, setIsToggling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onToggle || isToggling) return
    setIsToggling(true)
    try {
      await onToggle()
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete || isDeleting) return
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl shadow-sm border p-4 transition-all duration-300 hover:shadow-md ${
        task.completed
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
      } ${onClick ? "cursor-pointer hover:scale-[1.01]" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {onToggle && (
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                task.completed
                  ? "bg-gradient-to-br from-green-500 to-green-600 border-green-500 text-white"
                  : "border-orange-300 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-800/30"
              } ${isToggling ? "animate-pulse" : ""}`}
            >
              {task.completed ? (
                <CheckIcon className="w-4 h-4 mx-auto" />
              ) : (
                <CheckOutline className="w-4 h-4 mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-orange-500" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0">
            <span
              className={`block transition-all duration-200 font-medium truncate ${
                task.completed ? "text-green-800 dark:text-green-200" : "text-orange-800 dark:text-orange-200"
              }`}
            >
              {task.title}
            </span>

            {/* Mostrar preview de contenido si existe */}
            {task.content && (
              <p
                className={`text-sm mt-1 line-clamp-2 break-words overflow-hidden ${
                  task.completed ? "text-green-600 dark:text-green-300" : "text-orange-600 dark:text-orange-300"
                }`}
              >
                {task.content
                  .replace(/\*\*(.*?)\*\*/g, "$1")
                  .replace(/\*(.*?)\*/g, "$1")
                  .replace(/`(.*?)`/g, "$1")
                  .substring(0, 100)}
                {task.content.length > 100 && "..."}
              </p>
            )}

            {/* Mostrar creador si está disponible y showCreator es true */}
            {showCreator && task.creator && (
              <div className="flex items-center space-x-1 mt-1">
                <UserIcon
                  className={`w-3 h-3 ${
                    task.completed ? "text-green-500 dark:text-green-400" : "text-orange-500 dark:text-orange-400"
                  }`}
                />
                <span
                  className={`text-xs ${
                    task.completed ? "text-green-600 dark:text-green-300" : "text-orange-600 dark:text-orange-300"
                  }`}
                >
                  {task.creator.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-8 h-8 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-200 flex items-center justify-center"
            title="Eliminar tarea"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <TrashIcon className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
