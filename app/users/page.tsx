'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Plus, Search, Edit, Trash2, User, Shield } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }
      const usersData = await response.json()
      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteUser(userId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Error al eliminar usuario')
        }
        
        await loadUsers() // Reload to get updated data
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Error al eliminar el usuario')
      }
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />
  }

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? 'Administrador' : 'Usuario'
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
              <p className="text-gray-600 mt-2">Gestiona los usuarios de la plataforma</p>
            </div>
            <Link href="/users/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza creando usuarios en tu plataforma'
                  }
                </p>
                {!searchTerm && (
                  <Link href="/users/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Usuario
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-lente-600" />
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Link href={`/users/${user.id}/edit`}>
                          <Button variant="ghost" size="sm" className="p-1">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <span className="font-medium">{getRoleLabel(user.role)}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      Registrado {formatDate(user.createdAt)}
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/users/${user.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Perfil
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="flex-1">
                        Enviar Mensaje
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
