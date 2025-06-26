"use client"

import { Navigate, Route, Routes } from "react-router-dom"
import { useAuth } from "./auth"
import { DarkModeProvider } from "./hooks/useDarkMode"
import { ViewModeProvider } from "./hooks/useViewMode"
import { ToastProvider } from "./hooks/useToast"
import Navbar from "./components/Navbar"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Boards from "./pages/Boards"
import BoardDetail from "./pages/BoardDetail"
import Preferences from "./pages/Preferences"
import LoadingSpinner from "./components/LoadingSpinner"

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  return (
    <DarkModeProvider>
      <ViewModeProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
            {user && <Navbar />}
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
              <Route path="/" element={user ? <Boards /> : <Navigate to="/login" replace />} />
              <Route path="/board/:id" element={user ? <BoardDetail /> : <Navigate to="/login" replace />} />
              <Route path="/preferences" element={user ? <Preferences /> : <Navigate to="/login" replace />} />
            </Routes>
          </div>
        </ToastProvider>
      </ViewModeProvider>
    </DarkModeProvider>
  )
}
