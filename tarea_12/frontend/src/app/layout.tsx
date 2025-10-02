import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'FaucetToken dApp',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh bg-gradient-to-b from-zinc-950 to-black text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
