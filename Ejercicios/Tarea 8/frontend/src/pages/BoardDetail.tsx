"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "react-router-dom"
import { api } from "../api"
import TaskItem from "../components/TaskItem"
import ShareModal from "../components/ShareModal"
import TaskModal from "../components/TaskModal"
import DeleteTasksModal from "../components/DeleteTasksModal"
import { useAuth } from "../auth"
import { useToast } from "../hooks/useToast"
import {
  PencilIcon,
  ShareIcon,
  PlusIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline"

type Task = {
  id: number
  title: string
  content?: string
  completed: boolean
  creatorId: number | null
  creator?: {
    id: number
    name: string
    email: string
  }
}

type BoardSummary = {
  id: number
  name: string
  ownerId: number
  owner?: {
    id: number
    name: string
    email: string
  }
  roles: { userId: number; role: "OWNER" | "EDITOR" | "VIEWER" }[]
}

export default function BoardDetail() {
  const { user, loading } = useAuth()
  const { id } = useParams()
  const boardId = Number(id)
  const { showTaskAdded, showNewTaskReceived, showTaskDeleted } = useToast()

  // Estados principales
  const [tasksOwn, setTasksOwn] = useState<Task[]>([])
  const [tasksOthers, setTasksOthers] = useState<Task[]>([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [boardName, setBoardName] = useState("")
  const [originalBoardName, setOriginalBoardName] = useState("")
  const [boardOwner, setBoardOwner] = useState<{ name: string; email: string } | null>(null)

  // Estados de permisos y UI
  const [owner, setOwner] = useState(false)
  const [edit, setEdit] = useState(false)
  const [showShare, setShare] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all")
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Estados de búsqueda
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchField, setSearchField] = useState<"title" | "content">("title")
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  // Estados del modal de tarea
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showDeleteTasksModal, setShowDeleteTasksModal] = useState(false)

  // Referencias para auto-refresh y detección de nuevas tareas
  const refreshInterval = useRef<number | null>(null)
  const lastTaskIds = useRef<Set<number>>(new Set())
  const isFirstLoad = useRef(true)

  // Función para cargar tareas del tablero
  const loadTasks = useCallback(() => {
    if (!user || user.id === undefined || user.id === null) {
      return Promise.resolve()
    }

    return api<Task[]>(`/boards/${boardId}/tasks`)
      .then((allTasks) => {
        const uid = Number(user.id)

        // Separar tareas propias de las de otros usuarios
        const ownTasks = allTasks.filter((t) => Number(t.creatorId) === uid)
        const otherTasks = allTasks.filter((t) => Number(t.creatorId) !== uid)

        // Detectar nuevas tareas para notificaciones
        const currentAllTaskIds = new Set(allTasks.map((t) => t.id))

        if (!isFirstLoad.current) {
          const newTaskIds = [...currentAllTaskIds].filter((id) => !lastTaskIds.current.has(id))

          if (newTaskIds.length > 0) {
            // Solo notificar tareas de otros usuarios
            newTaskIds.forEach((taskId) => {
              const newTask = allTasks.find((t) => t.id === taskId)
              if (newTask && newTask.creator && Number(newTask.creatorId) !== uid) {
                showNewTaskReceived(newTask.title, newTask.creator.name)
              }
            })
          }
        } else {
          isFirstLoad.current = false
        }

        // Actualizar referencias para próximo ciclo
        lastTaskIds.current = currentAllTaskIds

        setTasksOwn(ownTasks)
        setTasksOthers(otherTasks)
      })
      .catch((error) => {
        console.error("❌ Error loading tasks:", error)
      })
  }, [boardId, user, showNewTaskReceived])

  // Efecto principal para cargar datos del tablero
  useEffect(() => {
    if (loading || !user || user.id === undefined || user.id === null) {
      return
    }

    // Cargar información del tablero y permisos
    api<BoardSummary[]>("/boards").then((bs) => {
      const b = bs.find((x) => x.id === boardId)
      if (!b) return

      setBoardName(b.name)
      setOriginalBoardName(b.name)

      if (b.owner) {
        setBoardOwner({ name: b.owner.name, email: b.owner.email })
      }

      const uid = Number(user.id)
      setOwner(Number(b.ownerId) === uid)

      const roleRec = b.roles.find((r) => Number(r.userId) === uid)
      setEdit(uid === b.ownerId || roleRec?.role === "EDITOR")
    })

    loadTasks()

    // Configurar auto-refresh si está habilitado
    api("/preferences").then((p: any) => {
      if (refreshInterval.current) clearInterval(refreshInterval.current)
      if (p?.autoRefreshInterval) {
        refreshInterval.current = window.setInterval(() => {
          loadTasks()
        }, p.autoRefreshInterval * 1000)
      }
    })

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current)
    }
  }, [boardId, user, loading, loadTasks])

  // Función para guardar cambios en el nombre del tablero
  const saveBoardName = async () => {
    if (!owner || !boardName.trim() || boardName === originalBoardName) {
      setIsEditingName(false)
      setBoardName(originalBoardName)
      return
    }

    setIsEditing(true)
    try {
      await api(`/boards/${boardId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: boardName }),
      })

      setOriginalBoardName(boardName)
      setIsEditingName(false)
      showTaskAdded(`Tablero renombrado a "${boardName}"`)
    } catch (error) {
      setBoardName(originalBoardName)
      setIsEditingName(false)
    } finally {
      setIsEditing(false)
    }
  }

  // Función para cancelar edición del nombre
  const cancelEdit = () => {
    setBoardName(originalBoardName)
    setIsEditingName(false)
  }

  // Función para crear nueva tarea
  const createTask = async () => {
    if (!title.trim()) return
    setIsCreating(true)
    try {
      await api(`/boards/${boardId}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title, content: content || undefined }),
      })

      showTaskAdded(title)
      setTitle("")
      setContent("")
      setShowCreateForm(false) // Ocultar formulario después de crear
      loadTasks()
    } finally {
      setIsCreating(false)
    }
  }

  // Función para eliminar una tarea individual
  const handleTaskDelete = async (taskId: number, taskTitle: string) => {
    await api(`/boards/${boardId}/tasks/${taskId}`, {
      method: "DELETE",
    })

    showTaskDeleted(taskTitle)
    loadTasks()
  }

  // Función para eliminar todas las tareas completadas
  const handleBulkDeleteCompleted = async () => {
    const completedTasks = [...tasksOwn, ...tasksOthers].filter((task) => task.completed)

    if (completedTasks.length === 0) return

    setIsBulkDeleting(true)

    try {
      // Eliminar todas las tareas completadas en paralelo
      await Promise.all(
        completedTasks.map((task) =>
          api(`/boards/${boardId}/tasks/${task.id}`, {
            method: "DELETE",
          }),
        ),
      )

      showTaskDeleted(
        `${completedTasks.length} tarea${completedTasks.length > 1 ? "s" : ""} completada${completedTasks.length > 1 ? "s" : ""} eliminada${completedTasks.length > 1 ? "s" : ""}`,
      )

      loadTasks()
    } catch (error) {
      console.error("Error deleting completed tasks:", error)
      alert("Error al eliminar las tareas completadas")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  // Función para filtrar tareas según el filtro activo
  const filterTasks = (tasks: Task[]) => {
    let filtered = tasks

    // Aplicar filtro de estado
    switch (filter) {
      case "completed":
        filtered = filtered.filter((task) => task.completed)
        break
      case "pending":
        filtered = filtered.filter((task) => !task.completed)
        break
    }

    // Aplicar filtro de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter((task) => {
        const searchValue = searchField === "title" ? task.title : task.content || ""
        return searchValue.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    return filtered
  }

  // Función para abrir modal de tarea
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  // Función para cerrar modal de tarea
  const handleCloseTaskModal = () => {
    setSelectedTask(null)
    setShowTaskModal(false)
  }

  // Obtener tareas filtradas
  const getFilteredTasksOwn = () => filterTasks(tasksOwn)
  const getFilteredTasksOthers = () => filterTasks(tasksOthers)

  // Pantalla de carga
  if (loading || !user)
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 dark:border-red-400 border-t-red-600 dark:border-t-red-300 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando tablero...</p>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Encabezado del tablero */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 mb-8 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-600 rounded-2xl flex items-center justify-center">
                <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1">
                {owner ? (
                  <div className="space-y-2">
                    {/* Modo edición del nombre */}
                    {isEditingName ? (
                      <div className="flex items-center space-x-2">
                        <input
                          className="text-2xl font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 transition-all duration-200 flex-1 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                          value={boardName}
                          onChange={(e) => setBoardName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") saveBoardName()
                            if (e.key === "Escape") cancelEdit()
                          }}
                          autoFocus
                        />
                        <button
                          onClick={saveBoardName}
                          disabled={isEditing}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all duration-200"
                          title="Guardar cambios"
                        >
                          {isEditing ? (
                            <div className="w-5 h-5 border-2 border-green-600 dark:border-green-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <CheckIcon className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                          title="Cancelar"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      /* Modo visualización del nombre */
                      <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{boardName}</h1>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                          title="Editar nombre"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Información del propietario */}
                    {boardOwner && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Propietario:{" "}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{boardOwner.name}</span> (
                        {boardOwner.email})
                      </p>
                    )}
                  </div>
                ) : (
                  /* Vista para usuarios no propietarios */
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{boardName}</h1>
                    {boardOwner && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Propietario:{" "}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{boardOwner.name}</span> (
                        {boardOwner.email})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botón compartir - Solo para propietarios */}
            {owner && (
              <button
                onClick={() => setShare(true)}
                className="bg-gradient-to-r from-red-600 to-yellow-600 text-white px-4 py-2 rounded-xl font-medium hover:from-red-700 hover:to-yellow-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 flex items-center space-x-2 transform hover:scale-105"
              >
                <ShareIcon className="w-5 h-5" />
                <span>Compartir</span>
              </button>
            )}
          </div>
        </div>

        {/* Botón para mostrar formulario de crear tarea */}
        {edit && !showCreateForm && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-3xl font-medium hover:from-orange-700 hover:to-red-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 transition-all duration-200 flex items-center space-x-2 transform hover:scale-105 active:scale-95 shadow-md"
            >
              <div className="flex items-center space-x-1">
                <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
                  <PlusIcon className="w-3 h-3" />
                </div>
              </div>
              <span>Agregar Tarea</span>
            </button>
          </div>
        )}

        {/* Formulario para crear nueva tarea con editor */}
        {edit && showCreateForm && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 mb-8 transition-colors duration-300">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <PlusIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <input
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Título de la tarea..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && createTask()}
                    autoFocus
                  />
                </div>
                <button
                  onClick={createTask}
                  disabled={!title.trim() || isCreating}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-medium hover:from-orange-700 hover:to-red-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:scale-105 active:scale-95"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <PlusIcon className="w-5 h-5" />
                  )}
                  <span>Añadir</span>
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setTitle("")
                    setContent("")
                  }}
                  className="p-3 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                  title="Cancelar"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Editor de descripción */}
              <div className="ml-14">
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  placeholder="Descripción de la tarea (opcional)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Tip: Usa **negrita**, *cursiva*, `código`</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{content.length}/500</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de filtros, búsqueda y eliminación en lote */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 mb-8 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filtrar tareas</h3>

            {/* Botón de búsqueda */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                showSearch
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              title="Buscar tareas"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de búsqueda */}
          {showSearch && (
            <div className="mb-4 flex items-center space-x-2">
              {/* Dropdown para seleccionar campo de búsqueda */}
              <div className="relative">
                <button
                  onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                >
                  <span className="capitalize">{searchField === "title" ? "Título" : "Descripción"}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {showSearchDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        setSearchField("title")
                        setShowSearchDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 first:rounded-t-xl"
                    >
                      Título
                    </button>
                    <button
                      onClick={() => {
                        setSearchField("content")
                        setShowSearchDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 last:rounded-b-xl"
                    >
                      Descripción
                    </button>
                  </div>
                )}
              </div>

              {/* Campo de búsqueda */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={`Buscar en ${searchField === "title" ? "títulos" : "descripciones"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Botón para limpiar búsqueda */}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                  title="Limpiar búsqueda"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Botones de filtro */}
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  filter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Todas ({tasksOwn.length + tasksOthers.length})
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  filter === "pending"
                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Pendientes (
                {tasksOwn.filter((t) => !t.completed).length + tasksOthers.filter((t) => !t.completed).length})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  filter === "completed"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Completadas (
                {tasksOwn.filter((t) => t.completed).length + tasksOthers.filter((t) => t.completed).length})
              </button>
            </div>

            {/* Botón de eliminación en lote */}
            {edit &&
              (tasksOwn.filter((t) => t.completed).length > 0 || tasksOthers.filter((t) => t.completed).length > 0) && (
                <button
                  onClick={() => setShowDeleteTasksModal(true)}
                  disabled={isBulkDeleting}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  title="Eliminar todas las tareas completadas"
                >
                  {isBulkDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4" />
                      <span>
                        Limpiar completadas (
                        {tasksOwn.filter((t) => t.completed).length + tasksOthers.filter((t) => t.completed).length})
                      </span>
                    </>
                  )}
                </button>
              )}
          </div>
        </div>

        {/* Columnas de tareas */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Columna: Mis tareas */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <CheckBadgeIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tus Tareas</h2>
              <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {getFilteredTasksOwn().length}
              </span>
            </div>

            {getFilteredTasksOwn().length > 0 ? (
              <div className="space-y-3">
                {getFilteredTasksOwn().map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    showCreator={true}
                    onClick={() => handleTaskClick(task)}
                    onToggle={async () => {
                      await api(`/boards/${boardId}/tasks/${task.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ completed: !task.completed }),
                      })
                      loadTasks()
                    }}
                    onDelete={async () => {
                      await handleTaskDelete(task.id, task.title)
                    }}
                  />
                ))}
              </div>
            ) : (
              /* Estado vacío para mis tareas */
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <CheckBadgeIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No tienes tareas aún</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Crea tu primera tarea arriba</p>
              </div>
            )}
          </div>

          {/* Columna: Tareas del equipo */}
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <UserGroupIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tareas del Equipo</h2>
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {getFilteredTasksOthers().length}
              </span>
            </div>

            {getFilteredTasksOthers().length > 0 ? (
              <div className="space-y-3">
                {getFilteredTasksOthers().map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    showCreator={true}
                    onClick={() => handleTaskClick(task)}
                    onToggle={
                      edit
                        ? async () => {
                            await api(`/boards/${boardId}/tasks/${task.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ completed: !task.completed }),
                            })
                            loadTasks()
                          }
                        : undefined
                    }
                    onDelete={
                      edit
                        ? async () => {
                            await handleTaskDelete(task.id, task.title)
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              /* Estado vacío para tareas del equipo */
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <UserGroupIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay tareas del equipo</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Las tareas de otros miembros aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para compartir tablero - Solo para propietarios */}
        {showShare && owner && <ShareModal boardId={boardId} onClose={() => setShare(false)} />}

        {/* Modal de tarea */}
        {showTaskModal && selectedTask && (
          <TaskModal
            task={selectedTask}
            onClose={handleCloseTaskModal}
            onUpdate={loadTasks}
            boardId={boardId}
            canEdit={edit}
          />
        )}

        {/* Modal de confirmación para eliminar tareas completadas */}
        {showDeleteTasksModal && (
          <DeleteTasksModal
            isOpen={showDeleteTasksModal}
            taskCount={tasksOwn.filter((t) => t.completed).length + tasksOthers.filter((t) => t.completed).length}
            onClose={() => setShowDeleteTasksModal(false)}
            onConfirm={handleBulkDeleteCompleted}
          />
        )}
      </div>
    </div>
  )
}
