import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lente AI - Plataforma de Inteligencia Artificial',
  description: 'Plataforma de IA personalizada para Lente, potenciada por Bravilo',
  keywords: 'IA, inteligencia artificial, chatbot, agentes, Lente',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/lente-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
