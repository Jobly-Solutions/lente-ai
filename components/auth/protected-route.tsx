'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Bot } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  // MODO DESARROLLO: Deshabilitar autenticación temporalmente
  const DEVELOPMENT_MODE = false
  
  if (DEVELOPMENT_MODE) {
    console.log('🔧 MODO DESARROLLO: Autenticación deshabilitada')
    return <>{children}</>
  }

  const { user, profile, loading } = useAuth()
  // Do not block rendering if a user is already present (even if profile is still loading)
  const effectiveLoading = false // never block UI; guards rely on user/profile when available
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [adminRedirecting, setAdminRedirecting] = useState(false)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set a timeout to prevent infinite loading
    const id = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ ProtectedRoute loading timeout, forcing completion')
        setRedirecting(false)
      }
    }, 5000) // 5 second timeout for better UX

    setTimeoutId(id)

    return () => {
      if (id) clearTimeout(id)
    }
  }, [effectiveLoading])

  useEffect(() => {
    if (redirecting) return

    // If not loading and no user, redirect to login
    if (!user) {
      console.log('🔒 No user found, redirecting to login')
      setRedirecting(true)
      router.push('/auth/login')
      return
    }

    // If admin required and user is not admin, redirect to /chat
    if (requireAdmin && profile?.role !== 'admin') {
      console.log('🔒 Admin access required, redirecting to chat')
      setAdminRedirecting(true)
      router.replace('/chat')
      return
    }

    setRedirecting(false)
  }, [user, profile, loading, requireAdmin, router, redirecting])

  // Show loading state
  if (effectiveLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-lente-600 rounded-lg flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {redirecting ? 'Redirigiendo...' : 'Cargando...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no user after loading, don't render anything (will redirect)
  if (!user) {
    return null
  }

  // If admin required and user is not admin, show loading while redirecting
  if (requireAdmin && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-lente-600 rounded-lg flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Redirigiendo a chat...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render children if all checks pass
  return <>{children}</>
}
