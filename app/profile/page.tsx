'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LenteLogo } from '@/components/ui/lente-logo'
import { User, Mail, Building, Shield, Calendar, Save, Edit, X, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProfileFormData {
  full_name: string
  email: string
  company: string
  role: string
  avatar_url?: string
}

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    email: '',
    company: '',
    role: '',
    avatar_url: ''
  })

  console.log('🚀 ProfilePage renderizado - editing inicial:', editing)

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        company: profile.company || '',
        role: profile.role || 'user',
        avatar_url: profile.avatar_url || ''
      })
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    console.log('🔄 Cambiando campo:', name, 'valor:', value, 'editing:', editing)
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditClick = () => {
    console.log('🖱️ Click en Editar Perfil, estado actual:', editing)
    setEditing(true)
    console.log('🔄 Estado editing cambiado a: true')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      const updates = {
        full_name: formData.full_name.trim(),
        company: formData.company.trim(),
        updated_at: new Date().toISOString()
      }

      console.log('💾 Guardando cambios:', updates)

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Actualizar el contexto local
      await updateProfile(updates)
      
      setMessage('Perfil actualizado exitosamente')
      setEditing(false)
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      console.error('❌ Error al actualizar perfil:', err)
      setError(err.message || 'Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    console.log('❌ Cancelando edición')
    setEditing(false)
    setError('')
    setMessage('')
    // Restaurar datos originales
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        company: profile.company || '',
        role: profile.role || 'user',
        avatar_url: profile.avatar_url || ''
      })
    }
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador', color: 'text-red-600', bgColor: 'bg-red-100' }
      case 'user':
        return { label: 'Usuario', color: 'text-blue-600', bgColor: 'bg-blue-100' }
      default:
        return { label: role, color: 'text-gray-600', bgColor: 'bg-gray-100' }
    }
  }

  const roleInfo = getRoleDisplay(formData.role)

  // Debug: mostrar estado actual
  console.log('🔍 Estado actual - editing:', editing, 'loading:', loading, 'profile:', !!profile)

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando perfil...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header de la página */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
            <p className="text-gray-600">Gestiona tu información personal y configuración de cuenta</p>
          </div>

          {/* Mensajes de estado */}
          {(message || error) && (
            <div className="mb-6">
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {message}
                  </div>
                  <button onClick={() => setMessage('')} className="text-green-700 hover:text-green-800">×</button>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                  </div>
                  <button onClick={() => setError('')} className="text-red-700 hover:text-red-800">×</button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Panel izquierdo - Información del perfil */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Información Personal</span>
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu información personal y de contacto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar y Logo */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <LenteLogo size="lg" showText={false} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{profile.full_name || 'Sin nombre'}</h3>
                        <p className="text-sm text-gray-500">{profile.email}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {roleInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Nombre completo */}
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nombre Completo *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="full_name"
                          name="full_name"
                          type="text"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Tu nombre completo"
                          className="pl-10"
                          disabled={!editing}
                          required
                        />
                      </div>
                    </div>

                    {/* Email (solo lectura) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          disabled
                          className="pl-10 bg-gray-50"
                        />
                      </div>
                      <p className="text-xs text-gray-500">El correo electrónico no se puede modificar</p>
                    </div>

                    {/* Empresa */}
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="company"
                          name="company"
                          type="text"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Nombre de tu empresa"
                          className="pl-10"
                          disabled={!editing}
                        />
                      </div>
                    </div>

                  </form>
                  
                  {/* Botones de acción - FUERA del formulario */}
                  <div className="flex space-x-3 pt-4">
                    {!editing ? (
                      <Button
                        type="button"
                        onClick={handleEditClick}
                        className="flex items-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Editar Perfil</span>
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            handleSubmit(e)
                          }}
                          disabled={loading}
                          className="flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={loading}
                          className="flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancelar</span>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Panel derecho - Información de la cuenta */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Información de la Cuenta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rol */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Rol</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </div>

                  {/* Fecha de creación */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Miembro desde</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : 'N/A'}
                    </span>
                  </div>

                  {/* Última actualización */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Última actualización</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('es-ES') : 'N/A'}
                    </span>
                  </div>

                  {/* Acciones rápidas */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Acciones Rápidas</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => window.location.href = '/chat'}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Ir al Chat
                      </Button>
                      {profile.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => window.location.href = '/admin'}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Panel de Admin
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
