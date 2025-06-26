"use client"

import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../auth"
import { HomeIcon, CogIcon, ArrowRightOnRectangleIcon, Squares2X2Icon } from "@heroicons/react/24/outline"

export default function Navbar() {
  const { logout, user } = useAuth()
  const nav = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <Squares2X2Icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-yellow-600 dark:from-red-400 dark:to-yellow-400 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive("/")
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span className="font-medium">Tableros</span>
            </Link>

            <Link
              to="/preferences"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive("/preferences")
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <CogIcon className="w-5 h-5" />
              <span className="font-medium">Preferencias</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
              Hola, <span className="font-semibold text-gray-900 dark:text-gray-100">{user?.name}</span>
            </div>
            <button
              onClick={async () => {
                await logout()
                nav("/login")
              }}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              <span className="hidden sm:inline font-medium">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
