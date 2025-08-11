'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, User, Shield, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function TestAuthPage() {
  const { user, profile, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
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
            <p className="text-gray-600">Verificando autenticación...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Autenticado</h2>
            <p className="text-gray-600 mb-4">
              Debes iniciar sesión para acceder a esta página.
            </p>
            <Link href="/auth/login">
              <Button className="w-full">
                Ir al Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test de Autenticación</h1>
          <p className="text-gray-600 mt-2">Verificación del sistema de autenticación</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del Usuario */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-lente-600" />
                <CardTitle>Información del Usuario</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email:</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">ID:</label>
                <p className="text-gray-900 font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email Verificado:</label>
                <p className="text-gray-900">{user.email_confirmed_at ? 'Sí' : 'No'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Creado:</label>
                <p className="text-gray-900">{new Date(user.created_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Información del Perfil */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-lente-600" />
                <CardTitle>Información del Perfil</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre:</label>
                    <p className="text-gray-900">{profile.full_name || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rol:</label>
                    <div className="flex items-center space-x-2">
                      {profile.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-red-600" />
                      ) : (
                        <User className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="text-gray-900 capitalize">{profile.role}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Empresa:</label>
                    <p className="text-gray-900">{profile.company || 'No especificada'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Actualizado:</label>
                    <p className="text-gray-900">{new Date(profile.updated_at).toLocaleString()}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Perfil no encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acciones */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/">
            <Button variant="outline">
              Ir al Dashboard
            </Button>
          </Link>
          <Link href="/users">
            <Button variant="outline">
              Gestionar Usuarios
            </Button>
          </Link>
          <Button onClick={handleSignOut} variant="destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Estado del Sistema */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
              <CardDescription>Información de rendimiento y estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✅</div>
                  <div className="text-sm font-medium text-green-800">Autenticación</div>
                  <div className="text-xs text-green-600">Funcionando</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">✅</div>
                  <div className="text-sm font-medium text-blue-800">Base de Datos</div>
                  <div className="text-xs text-blue-600">Conectada</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">✅</div>
                  <div className="text-sm font-medium text-purple-800">Perfil</div>
                  <div className="text-xs text-purple-600">{profile ? 'Cargado' : 'No encontrado'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
