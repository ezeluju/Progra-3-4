import React, { useState, useEffect } from 'react';

export type Task = {
  id: string;
  texto: string;
  completada: boolean;
};

export default function TaskApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [texto, setTexto] = useState('');
  const [filter, setFilter] = useState<'todas' | 'activas' | 'completadas'>('todas');

  useEffect(() => {
    fetch('/api/tareas')
      .then(res => res.json())
      .then(data => setTasks(data.tareas));
  }, []);

  const handleAdd = async () => {
    if (!texto.trim()) return;
    const res = await fetch('/api/tareas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    const data = await res.json();
    setTasks(prev => [...prev, data.tarea]);
    setTexto('');
  };

  const toggleTask = async (id: string) => {
    const res = await fetch(`/api/tareas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle' }),
    });
    const data = await res.json();
    setTasks(prev => prev.map(t => (t.id === id ? data.tarea : t)));
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tareas/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = async () => {
    await fetch('/api/tareas?completadas=true', { method: 'DELETE' });
    setTasks(prev => prev.filter(t => !t.completada));
  };

  const filteredTasks = tasks.filter(t =>
    filter === 'activas' ? !t.completada : filter === 'completadas' ? t.completada : true
  );

  return (
    <section className="max-w-xl mx-auto my-12 p-8 bg-white rounded-lg shadow-xl">
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
        📝 Lista de Tareas
      </h1>

      <div className="flex gap-2 mb-4">
        <input
          className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Escribe una tarea..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Agregar
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="space-x-2">
          {['todas', 'activas', 'completadas'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-3 py-1 rounded-full ${
                filter === f ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={clearCompleted}
          className="text-red-500 hover:underline"
        >
          Limpiar Completadas
        </button>
      </div>

      <ul className="space-y-3">
        {filteredTasks.map(task => (
          <li
            key={task.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={task.completada}
                onChange={() => toggleTask(task.id)}
                className="mr-3 w-5 h-5 text-blue-500"
              />
              <span className={task.completada ? 'line-through text-gray-400' : ''}>
                {task.texto}
              </span>
            </div>
            <button
              onClick={() => deleteTask(task.id)}
              className="text-red-500 hover:text-red-700"
            >
              ✖
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
