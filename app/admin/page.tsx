'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Shield, Users, Bot, Database, Settings, AlertTriangle } from 'lucide-react'

const ALLOWED_ADMIN_EMAIL = 'jc.falcon@lenteconsulting.com'

export default function AdminHomePage() {
  const { user, profile } = useAuth()
  const isAllowed = !!user?.email && user.email.toLowerCase() === ALLOWED_ADMIN_EMAIL.toLowerCase()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-lente-600" />
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            </div>
            <p className="text-gray-600 mt-2">
              Acceso restringido para {ALLOWED_ADMIN_EMAIL}
            </p>
          </div>

          {!isAllowed ? (
            <Card className="max-w-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Acceso restringido</span>
                </CardTitle>
                <CardDescription>
                  Este panel solo está disponible para {ALLOWED_ADMIN_EMAIL}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">
                  Usuario actual: {user?.email || 'No autenticado'}
                </p>
                <Link href="/">
                  <Button variant="outline">Volver al inicio</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/users">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-lente-600" />
                      <span>Usuarios</span>
                    </CardTitle>
                    <CardDescription>Gestionar usuarios y roles</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/admin/assignments">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-lente-600" />
                      <span>Asignaciones</span>
                    </CardTitle>
                    <CardDescription>Asignar agentes a usuarios</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/agents">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bot className="w-5 h-5 text-lente-600" />
                      <span>Agentes</span>
                    </CardTitle>
                    <CardDescription>Crear y administrar agentes</CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/datastores">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="w-5 h-5 text-lente-600" />
                      <span>Datastores</span>
                    </CardTitle>
                    <CardDescription>Gestionar fuentes de datos</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}


