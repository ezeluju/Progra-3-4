import React, { useState, useEffect } from 'react'

export type Task = {
  id: string
  texto: string
  completada: boolean
}

export default function TaskApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [texto, setTexto] = useState('')
  const [filter, setFilter] = useState<'todas' | 'activas' | 'completadas'>('todas')

  useEffect(() => {
    fetch('/api/tareas')
      .then(res => res.json())
      .then(data => setTasks(data.tareas))
      .catch(err => console.error('Error cargando tareas:', err))
  }, [])

  const handleAdd = async () => {
    if (!texto.trim()) return
    try {
      const res = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setTasks(prev => [...prev, data.tarea])
      setTexto('')
    } catch (err) {
      console.error('No se pudo crear la tarea:', err)
    }
  }

  const toggleTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tareas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setTasks(prev => prev.map(t => (t.id === id ? data.tarea : t)))
    } catch (err) {
      console.error('No se pudo cambiar el estado:', err)
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tareas/${id}`, { method: 'DELETE' })
      if (res.status !== 204) throw new Error(`Error ${res.status}`)
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('No se pudo borrar la tarea:', err)
    }
  }

  const clearCompleted = async () => {
    try {
      const res = await fetch('/api/tareas?completadas=true', { method: 'DELETE' })
      if (res.status !== 204) throw new Error(`Error ${res.status}`)
      setTasks(prev => prev.filter(t => !t.completada))
    } catch (err) {
      console.error('No se pudo limpiar completadas:', err)
    }
  }

  const filteredTasks = tasks.filter(t =>
    filter === 'activas'
      ? !t.completada
      : filter === 'completadas'
      ? t.completada
      : true
  )

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header con fondo degradado */}
      <header className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
        <h1 className="text-2xl font-bold text-white text-center tracking-wide">
          📝 Mis Tareas
        </h1>
      </header>

      {/* Cuerpo de la tarjeta */}
      <main className="p-6 space-y-6">
        {/* Input para nueva tarea */}
        <div className="flex gap-2">
          <input
            className="flex-grow bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-200"
            placeholder="¿Qué quieres hacer hoy?"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition duration-200"
          >
            Agregar
          </button>
        </div>

        {/* Filtros y limpiar completadas */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <div className="flex space-x-2">
            {(['todas', 'activas', 'completadas'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm font-medium px-3 py-1 rounded-full transition duration-200 ${
                  filter === f
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={clearCompleted}
            className="text-sm text-red-500 hover:text-red-600 transition duration-150"
          >
            — Limpiar completadas —
          </button>
        </div>

        {/* Lista de tareas */}
        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
          {filteredTasks.length === 0 ? (
            <li className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No hay tareas aquí. ¡Agrega una!
            </li>
          ) : (
            filteredTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150"
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={task.completada}
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 text-indigo-500 border-gray-300 rounded focus:ring-indigo-400"
                  />
                  <span
                    className={`text-gray-800 dark:text-gray-200 text-base ${
                      task.completada ? 'line-through text-gray-400 dark:text-gray-500' : ''
                    }`}
                  >
                    {task.texto}
                  </span>
                </label>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-red-500 hover:text-red-600 transition duration-150 text-lg font-semibold"
                  aria-label="Eliminar tarea"
                >
                  &times;
                </button>
              </li>
            ))
          )}
        </ul>
      </main>

      {/* Pie de la tarjeta */}
      <footer className="px-6 py-4 bg-gray-50 dark:bg-gray-700 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Hecho con 💜 usando Astro + React + Vite
        </p>
      </footer>
    </div>
  )
}
