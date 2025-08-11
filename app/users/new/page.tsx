'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, ArrowLeft, Save, User, Shield, Eye, EyeOff, Lock, Bot, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { braviloApiClient, Agent as BraviloAgent } from '@/lib/bravilo-api'
import { supabase } from '@/lib/supabase'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [agents, setAgents] = useState<BraviloAgent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)

  const userRoles = [
    { value: 'user', label: 'Usuario', icon: User, description: 'Acceso básico a la plataforma' },
    { value: 'admin', label: 'Administrador', icon: Shield, description: 'Acceso completo y gestión de usuarios' }
  ]

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      setAgentsLoading(true)
      const agentsData = await braviloApiClient.getAgents()
      const visibleAgents = agentsData.filter(agent => !agent.hidden && agent.status !== 'inactive')
      setAgents(visibleAgents)
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setAgentsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validar contraseñas
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al crear el usuario')
        setLoading(false)
        return
      }

      setSuccess(true)
      
      // Create assignments if agents are selected
      if (selectedAgents.length > 0 && data.user) {
        await createAgentAssignments(data.user.id, selectedAgents)
      }
      
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      })
      setSelectedAgents([])

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push('/users')
      }, 2000)

    } catch (error) {
      console.error('Error creating user:', error)
      setError('Error inesperado. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function createAgentAssignments(userId: string, agentIds: string[]) {
    try {
      console.log('🔄 Creando asignaciones de agentes para usuario:', userId)
      
      for (const agentId of agentIds) {
        // Find agent data
        const agentData = agents.find(a => a.id === agentId)
        if (!agentData) continue

        // Check if agent exists in local database
        const { data: existingAgents, error: checkError } = await supabase
          .from('agents')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (checkError && !checkError.message?.includes('No rows found')) {
          console.error('Error checking agent:', checkError)
          continue
        }

        const foundAgent = Array.isArray(existingAgents) ? existingAgents[0] : undefined
        let localAgentId = foundAgent?.id

        if (!foundAgent) {
          // Create agent in local database
          const { data: newAgent, error: createError } = await supabase
            .from('agents')
            .insert({
              agent_id: agentId,
              name: agentData.name,
              description: agentData.description,
              is_active: true,
              is_shared: false
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating agent:', createError)
            continue
          }

          localAgentId = newAgent.id
        }

        // Create assignment
        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert({
            user_id: userId,
            agent_id: localAgentId
          })

        if (assignmentError) {
          console.error('Error creating assignment:', assignmentError)
        } else {
          console.log('✅ Asignación creada para agente:', agentData.name)
        }
      }
    } catch (error) {
      console.error('Error creating agent assignments:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/users" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Usuarios
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
          <p className="text-gray-600 mt-2">Crea un nuevo usuario con acceso inmediato a la plataforma</p>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Usuario creado exitosamente
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>El usuario puede iniciar sesión inmediatamente con su email y contraseña.</p>
                  {selectedAgents.length > 0 && (
                    <p>Se han asignado {selectedAgents.length} agente{selectedAgents.length !== 1 ? 's' : ''} al usuario.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Users className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error al crear el usuario
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-lente-600" />
              <CardTitle>Información del Usuario</CardTitle>
            </div>
            <CardDescription>
              Completa la información para crear el nuevo usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Juan Pérez"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Nombre completo del usuario
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="juan.perez@empresa.com"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email que usará para iniciar sesión
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Repite la contraseña"
                    className="w-full"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Confirma la contraseña para verificar
                </p>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Rol del Usuario *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userRoles.map((role) => (
                    <div
                      key={role.value}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.role === role.value
                          ? 'border-lente-500 bg-lente-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, role: role.value }))}
                    >
                      <div className="flex items-center space-x-3">
                        <role.icon className="w-5 h-5 text-lente-600" />
                        <div>
                          <div className="font-medium text-gray-900">{role.label}</div>
                          <div className="text-sm text-gray-500">{role.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selección de Agentes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agentes Asignados (Opcional)
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Selecciona los agentes que estarán disponibles para este usuario
                </p>
                
                {agentsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lente-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Cargando agentes...</p>
                  </div>
                ) : agents.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Bot className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No hay agentes disponibles</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedAgents.includes(agent.id)
                            ? 'border-lente-500 bg-lente-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleAgentSelection(agent.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Bot className="w-5 h-5 text-lente-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{agent.name}</div>
                            {agent.description && (
                              <div className="text-xs text-gray-500">{agent.description}</div>
                            )}
                          </div>
                          {selectedAgents.includes(agent.id) && (
                            <Plus className="w-4 h-4 text-lente-600 rotate-45" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedAgents.length > 0 && (
                  <p className="text-sm text-lente-600 mt-2">
                    {selectedAgents.length} agente{selectedAgents.length !== 1 ? 's' : ''} seleccionado{selectedAgents.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Información Importante</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• El usuario podrá iniciar sesión inmediatamente</li>
                  <li>• No se enviará email de confirmación</li>
                  <li>• Los administradores tienen acceso completo a la plataforma</li>
                  <li>• Los usuarios regulares tienen acceso limitado</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/users">
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando Usuario...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Crear Usuario
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
    </ProtectedRoute>
  )
}
