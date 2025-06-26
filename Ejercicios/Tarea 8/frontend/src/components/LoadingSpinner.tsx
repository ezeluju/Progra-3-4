export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-red-200 dark:border-red-400 border-t-red-600 dark:border-t-red-300 rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-yellow-400 dark:border-r-yellow-300 rounded-full animate-spin animate-reverse"></div>
      </div>
      <p className="ml-4 text-gray-600 dark:text-gray-300 font-medium">Cargando...</p>
    </div>
  )
}
