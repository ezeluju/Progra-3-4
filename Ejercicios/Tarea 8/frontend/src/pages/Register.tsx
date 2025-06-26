"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../auth"
import { useNavigate, Link } from "react-router-dom"
import { z } from "zod"
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline"

const schema = z
  .object({
    email: z.string().email("Email inválido"),
    name: z.string().min(1, "Nombre requerido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  })
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { register } = useAuth()
  const nav = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErr(null)

    // Validación cliente
    const result = schema.safeParse(form)
    if (!result.success) {
      setErr(result.error.errors[0].message)
      setLoading(false)
      return
    }

    try {
      await register(form.email, form.name, form.password)
      nav("/")
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Verificar si las contraseñas coinciden en tiempo real
  const passwordsMatch = form.password && form.confirmPassword && form.password === form.confirmPassword
  const passwordsDontMatch = form.password && form.confirmPassword && form.password !== form.confirmPassword

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Crear cuenta</h1>
          <p className="text-gray-600 dark:text-gray-300">Únete a TaskFlow hoy</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-6">
            {err && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm animate-pulse">
                {err}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre completo</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {form.password && form.password.length < 6 && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <ShieldCheckIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${
                    passwordsDontMatch
                      ? "border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400"
                      : passwordsMatch
                        ? "border-green-300 dark:border-green-600 focus:ring-green-500 dark:focus:ring-green-400"
                        : "border-gray-200 dark:border-gray-700 focus:ring-orange-500 dark:focus:ring-orange-400"
                  }`}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Match Indicators */}
              {form.confirmPassword && (
                <div className="mt-2">
                  {passwordsMatch ? (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center space-x-1">
                      <ShieldCheckIcon className="w-4 h-4" />
                      <span>Las contraseñas coinciden</span>
                    </p>
                  ) : passwordsDontMatch ? (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                      <LockClosedIcon className="w-4 h-4" />
                      <span>Las contraseñas no coinciden</span>
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !passwordsMatch}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creando cuenta...</span>
                </div>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors duration-200"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
