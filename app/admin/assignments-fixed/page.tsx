'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Users, Search, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, Settings, Key } from 'lucide-react'
import { supabase, Profile } from '@/lib/supabase'
import { braviloApiClient, Agent as BraviloAgent } from '@/lib/bravilo-api'
import { formatDate } from '@/lib/utils'

export default function FixedAssignmentsPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [agents, setAgents] = useState<BraviloAgent[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [showApiConfig, setShowApiConfig] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [isApiConfigured, setIsApiConfigured] = useState(false)

  useEffect(() => {
    checkApiConfiguration()
    loadData()
  }, [])

  function checkApiConfiguration() {
    const configured = braviloApiClient.isApiConfigured()
    setIsApiConfigured(configured)
    if (!configured) {
      setError('API de Bravilo no configurada. Usando agentes de prueba.')
    }
  }

  async function loadData() {
    try {
      setError('')
      setSuccessMessage('')
      console.log('🔄 Cargando datos...')

      // Cargar usuarios desde Supabase
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (usersError) {
        console.error('❌ Error cargando usuarios:', usersError)
        throw usersError
      }

      console.log(`✅ ${usersData?.length || 0} usuarios cargados`)
      setUsers(usersData || [])

      // Cargar agentes
      await loadAgentsFromAPI()

      // Cargar asignaciones existentes
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          profiles!assignments_user_id_fkey(id, full_name, email),
          agents!assignments_agent_id_fkey(id, name, description)
        `)
        .order('assigned_at', { ascending: false })

      if (assignmentsError) {
        console.error('❌ Error cargando asignaciones:', assignmentsError)
        throw assignmentsError
      }

      console.log(`✅ ${assignmentsData?.length || 0} asignaciones cargadas`)
      setAssignments(assignmentsData || [])

    } catch (error: any) {
      console.error('❌ Error general cargando datos:', error)
      setError(error.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  async function loadAgentsFromAPI() {
    try {
      setAgentsLoading(true)
      console.log('🔄 Cargando agentes desde API de Bravilo...')

      const agentsData = await braviloApiClient.getAgents()
      
      // Filtrar solo agentes activos
      const activeAgents = agentsData.filter(agent => agent.status === 'active')
      
      console.log(`✅ ${activeAgents.length} agentes activos cargados`)
      
      setAgents(activeAgents)
      setSuccessMessage(`${activeAgents.length} agentes cargados desde Bravilo`)
    } catch (error: any) {
      console.error('❌ Error cargando agentes desde API:', error)
      setError('Error cargando agentes: ' + error.message)
    } finally {
      setAgentsLoading(false)
    }
  }

  async function configureApiKey() {
    if (!apiKey.trim()) {
      setError('Por favor ingresa una API key válida')
      return
    }

    try {
      // Guardar en localStorage para esta sesión
      localStorage.setItem('BRAVILO_API_KEY', apiKey)
      
      // Recargar agentes con la nueva API key
      setIsApiConfigured(true)
      setShowApiConfig(false)
      setApiKey('')
      setError('')
      
      await loadAgentsFromAPI()
      setSuccessMessage('API key configurada exitosamente')
    } catch (error: any) {
      setError('Error configurando API key: ' + error.message)
    }
  }

  async function createAssignment() {
    if (!selectedUser || !selectedAgent) {
      setError('Por favor selecciona un usuario y un agente')
      return
    }

    try {
      setError('')
      setSuccessMessage('')
      console.log('🔄 Creando asignación:', { selectedUser, selectedAgent })

      // Verificar que el agente existe en la API
      const selectedAgentData = agents.find(a => a.id === selectedAgent)
      if (!selectedAgentData) {
        throw new Error('Agente no encontrado')
      }

      // Crear el agente en la base de datos local si no existe
      const { data: existingAgents, error: checkError } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_id', selectedAgent)
        .order('created_at', { ascending: false })
        .limit(1)

      if (checkError && !checkError.message?.includes('No rows found')) {
        throw checkError
      }

      const foundAgent = Array.isArray(existingAgents) ? existingAgents[0] : undefined
      let localAgentId = foundAgent?.id

      if (!foundAgent) {
        // Crear agente en base de datos local
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
          throw createError
        }

        localAgentId = newAgent.id
        console.log('✅ Agente creado en base de datos local')
      }

      // Crear la asignación
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          user_id: selectedUser,
          agent_id: localAgentId
        })

      if (assignmentError) {
        console.error('❌ Error creando asignación:', assignmentError)
        throw assignmentError
      }

      console.log('✅ Asignación creada exitosamente')
      
      // Recargar datos
      await loadData()
      setSelectedUser('')
      setSelectedAgent('')
      setSuccessMessage('Asignación creada exitosamente')
    } catch (error: any) {
      console.error('❌ Error creando asignación:', error)
      setError(error.message || 'Error al crear la asignación')
    }
  }

  async function deleteAssignment(userId: string, agentId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta asignación?')) return

    try {
      setError('')
      setSuccessMessage('')
      console.log('🔄 Eliminando asignación:', { userId, agentId })

      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('user_id', userId)
        .eq('agent_id', agentId)

      if (error) {
        console.error('❌ Error eliminando asignación:', error)
        throw error
      }

      console.log('✅ Asignación eliminada exitosamente')
      
      // Recargar datos
      await loadData()
      setSuccessMessage('Asignación eliminada exitosamente')
    } catch (error: any) {
      console.error('❌ Error eliminando asignación:', error)
      setError(error.message || 'Error al eliminar la asignación')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-lente-600 rounded-lg flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando asignaciones...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Asignaciones</h1>
          <p className="text-gray-600 mt-2">Asigna agentes de Bravilo a usuarios de la plataforma</p>
        </div>

        {/* Configuración de API */}
        {!isApiConfigured && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-800">
                <Settings className="w-5 h-5" />
                <span>Configuración de API de Bravilo</span>
              </CardTitle>
              <CardDescription className="text-yellow-700">
                Para usar tus agentes reales de Bravilo, configura tu API key
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showApiConfig ? (
                <div className="flex items-center space-x-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-yellow-800">API key no configurada. Usando agentes de prueba.</span>
                  <Button
                    onClick={() => setShowApiConfig(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Configurar API
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key de Bravilo
                    </label>
                    <Input
                      type="password"
                      placeholder="Ingresa tu API key de Bravilo"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="mb-2"
                    />
                    <p className="text-sm text-gray-600">
                      Obtén tu API key desde <a href="https://app.braviloai.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.braviloai.com</a>
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={configureApiKey} disabled={!apiKey.trim()}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                    <Button variant="outline" onClick={() => setShowApiConfig(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

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
              <div className="flex space-x-2">
                <Button
                  onClick={loadAgentsFromAPI}
                  disabled={agentsLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${agentsLoading ? 'animate-spin' : ''}`} />
                  Actualizar Agentes
                </Button>
                {isApiConfigured && (
                  <Button
                    onClick={() => setShowApiConfig(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    API Config
                  </Button>
                )}
              </div>
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
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Asignaciones Actuales</span>
            </CardTitle>
            <CardDescription>
              {assignments.length} asignación{assignments.length !== 1 ? 'es' : ''} activa{assignments.length !== 1 ? 's' : ''}
            </CardDescription>
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

        {/* Estado del Sistema */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-green-50 rounded">
                <div className="font-medium text-green-800">API de Bravilo</div>
                <div className="text-green-600">
                  {isApiConfigured ? '✅ Configurada' : '⚠️ No configurada'}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="font-medium text-blue-800">Agentes</div>
                <div className="text-blue-600">{agents.length} disponibles</div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <div className="font-medium text-purple-800">Usuarios</div>
                <div className="text-purple-600">{users.length} disponibles</div>
              </div>
              <div className="p-3 bg-orange-50 rounded">
                <div className="font-medium text-orange-800">Asignaciones</div>
                <div className="text-orange-600">{assignments.length} activas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
