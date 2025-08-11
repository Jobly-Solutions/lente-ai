'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Users, Search, Plus, Trash2, Check, X, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import { braviloApiClient, Agent as BraviloAgent } from '@/lib/bravilo-api'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

export default function AssignmentsPage() {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [agents, setAgents] = useState<BraviloAgent[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [apiConfigured, setApiConfigured] = useState(false)

  useEffect(() => {
    // Check if API is configured
    setApiConfigured(braviloApiClient.isApiConfigured())
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setError('')
      console.log('🔄 Cargando datos de asignaciones...')

      // Cargar usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*', { head: false })
        .order('full_name')

      if (usersError) {
        console.error('❌ Error cargando usuarios:', usersError)
        throw usersError
      }

      console.log(`✅ ${usersData?.length || 0} usuarios cargados`)

      // Cargar agentes desde la API de Bravilo
      await loadAgentsFromAPI()

      // Cargar asignaciones con joins
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          profiles!assignments_user_id_fkey(id, full_name, email),
          agents!assignments_agent_id_fkey(id, name, description)
        `, { head: false })
        .order('assigned_at', { ascending: false })

      if (assignmentsError) {
        console.error('❌ Error cargando asignaciones:', assignmentsError)
        throw assignmentsError
      }

      console.log(`✅ ${assignmentsData?.length || 0} asignaciones cargadas`)

      setUsers(usersData || [])
      setAssignments(assignmentsData || [])
    } catch (error: any) {
      console.error('❌ Error general cargando datos:', error)
      setError(error.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  const loadAgentsFromAPI = async () => {
    try {
      setAgentsLoading(true)
      console.log('🔄 Cargando agentes desde API de Bravilo...')

      const agentsData = await braviloApiClient.getAgents()
      
      // Filtrar agentes no ocultos (los agentes de Bravilo no usan status, usan hidden)
      const visibleAgents = agentsData.filter(agent => !agent.hidden && agent.status !== 'inactive')
      
      console.log(`✅ ${visibleAgents.length} agentes visibles cargados desde API`)
      
      setAgents(visibleAgents)
      
      // Clear any previous errors if successful
      if (visibleAgents.length > 0) {
        setError('')
      }
    } catch (error: any) {
      console.error('❌ Error cargando agentes desde API:', error)
      setError('Error cargando agentes desde la API de Bravilo: ' + error.message)
      
      // Set empty agents array on error
      setAgents([])
    } finally {
      setAgentsLoading(false)
    }
  }

  const createAssignment = async () => {
    if (!selectedUser || !selectedAgent) {
      setError('Por favor selecciona un usuario y un agente')
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      
      // Verificar estado de autenticación
      console.log('🔐 Estado de autenticación:', {
        user: !!user,
        profile: !!profile,
        profileRole: profile?.role,
        timestamp: new Date().toISOString()
      })
      
      console.log('🔄 Iniciando creación de asignación:', { 
        selectedUser, 
        selectedAgent,
        timestamp: new Date().toISOString()
      })

      // Verificar que el agente existe en la API
      const selectedAgentData = agents.find(a => a.id === selectedAgent)
      if (!selectedAgentData) {
        throw new Error('Agente no encontrado en la API')
      }

      // Crear el agente en la base de datos local si no existe
      const { data: existingAgents, error: checkError } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_id', selectedAgent)
        .order('created_at', { ascending: false })
        .limit(1)

      if (checkError && !checkError.message.includes('No rows found')) {
        throw checkError
      }

      const foundAgent = Array.isArray(existingAgents) ? existingAgents[0] : undefined
      let localAgentId = foundAgent?.id

      if (!foundAgent) {
        // Crear agente en base de datos local
        console.log('🔄 Creando agente local:', {
          agent_id: selectedAgent,
          name: selectedAgentData.name,
          description: selectedAgentData.description
        })

        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            agent_id: selectedAgent,
            name: selectedAgentData.name,
            description: selectedAgentData.description,
            is_active: true,
            is_shared: false
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creando agente local:', createError)
          throw new Error(`Error al crear agente local: ${createError.message}`)
        }

        if (!newAgent || !newAgent.id) {
          throw new Error('Agente creado pero no se obtuvo ID válido')
        }

        localAgentId = newAgent.id
        console.log('✅ Agente creado en base de datos local con ID:', localAgentId)
      }

      // Verificar que tenemos un ID válido para el agente
      if (!localAgentId) {
        throw new Error('No se pudo obtener el ID del agente local')
      }

      console.log('🔍 Creando asignación con:', { 
        user_id: selectedUser, 
        agent_id: localAgentId,
        agent_name: selectedAgentData.name 
      })

      // Verificar que el usuario esté autenticado
      if (!user || !profile) {
        throw new Error('Usuario no autenticado o perfil no cargado')
      }
      
      if (profile.role !== 'admin') {
        throw new Error('Usuario no tiene permisos de administrador')
      }
      
      // Validar que los IDs sean válidos
      if (!selectedUser || !localAgentId) {
        throw new Error('Usuario o agente no seleccionado correctamente')
      }
      
      // Verificar que el usuario y agente existan
      const userExists = users.find(u => u.id === selectedUser)
      const agentExists = agents.find(a => a.id === localAgentId)
      
      if (!userExists) {
        throw new Error('Usuario seleccionado no encontrado')
      }
      
      if (!agentExists) {
        throw new Error('Agente seleccionado no encontrado')
      }
      
      console.log('✅ Validaciones pasadas:', {
        user: userExists.full_name,
        agent: agentExists.name
      })
      
      // Crear la asignación directamente usando el cliente de Supabase
      console.log('🔗 Creando asignación directamente...')
      console.log('📤 Datos a insertar:', { 
        user_id: selectedUser, 
        agent_id: localAgentId,
        assigned_at: new Date().toISOString()
      })
      
      const { data: newAssignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          user_id: selectedUser,
          agent_id: localAgentId,
          assigned_at: new Date().toISOString()
        })
        .select()
        .single()

      if (assignmentError) {
        console.error('❌ Error creando asignación:', assignmentError)
        throw new Error(`Error al crear asignación: ${assignmentError.message}`)
      }

      console.log('✅ Asignación creada exitosamente:', newAssignment)

      console.log('✅ Asignación creada exitosamente')
      
      // Recargar datos
      await loadData()
      setSelectedUser('')
      setSelectedAgent('')
      setSuccessMessage('Asignación creada exitosamente')
    } catch (error: any) {
      console.error('❌ Error creando asignación:', {
        error: error,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name,
        errorKeys: Object.keys(error)
      })
      
      // Mensaje de error más descriptivo
      let errorMessage = 'Error al crear la asignación'
      
      if (error.message && error.message !== '{}') {
        errorMessage = error.message
      } else if (error.details) {
        errorMessage = `Error de base de datos: ${error.details}`
      } else if (error.hint) {
        errorMessage = `Error: ${error.hint}`
      } else if (error.name) {
        errorMessage = `Error: ${error.name}`
      } else {
        errorMessage = `Error desconocido: ${JSON.stringify(error)}`
      }
      
      console.log('📝 Mensaje de error final:', errorMessage)
      setError(errorMessage)
    }
  }

  const deleteAssignment = async (userId: string, agentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta asignación?')) return

    try {
      setError('')
      setSuccessMessage('')
      console.log('🔄 Eliminando asignación:', { userId, agentId })

      // Eliminar asignación directamente usando Supabase
      console.log('🗑️ Eliminando asignación directamente...')
      
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('user_id', userId)
        .eq('agent_id', agentId)

      if (deleteError) {
        console.error('❌ Error eliminando asignación:', deleteError)
        throw new Error(`Error al eliminar asignación: ${deleteError.message}`)
      }

      console.log('✅ Asignación eliminada exitosamente')

      console.log('✅ Asignación eliminada exitosamente')
      
      // Recargar datos
      await loadData()
      setSuccessMessage('Asignación eliminada exitosamente')
    } catch (error: any) {
      console.error('❌ Error eliminando asignación:', error)
      setError(error.message || 'Error al eliminar la asignación')
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando asignaciones...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Asignaciones</h1>
            <p className="text-gray-600 mt-2">Asigna agentes de Bravilo a usuarios de la plataforma</p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Mensaje de Éxito */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
              <Check className="w-5 h-5 mr-2" />
              {successMessage}
            </div>
          )}

          {/* Estado de la API */}
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Estado de la API de Bravilo</p>
                    <p className="text-sm text-blue-700">
                      {apiConfigured ? '✅ API configurada correctamente' : '⚠️ API no configurada - usando agentes de prueba'}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-blue-600">
                  {agents.length} agentes disponibles
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crear Nueva Asignación */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Nueva Asignación</span>
                  </CardTitle>
                  <CardDescription>
                    Selecciona un usuario y un agente de Bravilo para crear una nueva asignación
                  </CardDescription>
                </div>
                <Button
                  onClick={loadAgentsFromAPI}
                  disabled={agentsLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${agentsLoading ? 'animate-spin' : ''}`} />
                  Actualizar Agentes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-lente-500 focus:border-lente-500"
                  >
                    <option value="">Seleccionar usuario...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || 'Sin nombre'} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agente de Bravilo
                  </label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-lente-500 focus:border-lente-500"
                    disabled={agentsLoading}
                  >
                    <option value="">
                      {agentsLoading ? 'Cargando agentes...' : 'Seleccionar agente...'}
                    </option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} {agent.description && `- ${agent.description}`}
                      </option>
                    ))}
                  </select>
                  {agentsLoading && (
                    <p className="text-sm text-gray-500 mt-1">Cargando agentes desde API...</p>
                  )}
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={createAssignment}
                    disabled={!selectedUser || !selectedAgent || agentsLoading}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Asignar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Asignaciones */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Asignaciones Actuales</span>
                  </CardTitle>
                  <CardDescription>
                    {assignments.length} asignación{assignments.length !== 1 ? 'es' : ''} activa{assignments.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <p>No hay asignaciones creadas</p>
                  <p className="text-sm mt-2">Crea una nueva asignación usando el formulario de arriba</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={`${assignment.user_id}-${assignment.agent_id}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-lente-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-lente-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {assignment.profiles?.full_name || 'Usuario sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.profiles?.email || 'Sin email'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="font-medium">
                            {assignment.agents?.name || 'Agente sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Asignado {formatDate(assignment.assigned_at)}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAssignment(assignment.user_id, assignment.agent_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
