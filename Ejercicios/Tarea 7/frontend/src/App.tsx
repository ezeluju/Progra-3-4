import React from 'react'
import TaskApp from './components/TaskApp'
import './index.css'

function App() {
  return (
    // Fondo gris claro & degradado suave; modo oscuro incluido
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {/* Centra vertical y horizontal la tarjeta de tareas */}
      <TaskApp />
    </div>
  )
}

export default App
