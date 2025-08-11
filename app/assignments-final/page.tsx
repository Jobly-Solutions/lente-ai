'use client'

import { useState, useEffect } from 'react'
import { Bot, Users, Plus, Trash2, RefreshCw, CheckCircle, AlertCircle, Settings, Key, Database, Globe } from 'lucide-react'
import { supabase, Profile } from '@/lib/supabase'
import { braviloApiClient, Agent as BraviloAgent } from '@/lib/bravilo-api'
import { formatDate } from '@/lib/utils'

interface LocalAgent {
  id: string
  name: string
  description?: string
  agent_id?: string
  is_active: boolean
  is_shared: boolean
  created_at: string
}

export default function FinalAssignmentsPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [localAgents, setLocalAgents] = useState<LocalAgent[]>([])
  const [apiAgents, setApiAgents] = useState<BraviloAgent[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [agentSource, setAgentSource] = useState<'local' | 'api'>('local')
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

      // Cargar agentes locales (los mismos que usa /agents)
      await loadLocalAgents()

      // Cargar agentes de la API si está configurada
      if (isApiConfigured) {
        await loadApiAgents()
      }

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

  async function loadLocalAgents() {
    try {
      console.log('🔄 Cargando agentes locales...')
      
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (agentsError) {
        console.error('❌ Error cargando agentes locales:', agentsError)
        throw agentsError
      }

      console.log(`✅ ${agentsData?.length || 0} agentes locales cargados`)
      setLocalAgents(agentsData || [])
    } catch (error: any) {
      console.error('❌ Error cargando agentes locales:', error)
      setError('Error cargando agentes locales: ' + error.message)
    }
  }

  async function loadApiAgents() {
    try {
      setAgentsLoading(true)
      console.log('🔄 Cargando agentes desde API de Bravilo...')

      const agentsData = await braviloApiClient.getAgents()
      
      console.log(`✅ ${agentsData.length} agentes de API cargados`)
      
      setApiAgents(agentsData)
      setSuccessMessage(`${agentsData.length} agentes de API cargados`)
    } catch (error: any) {
      console.error('❌ Error cargando agentes desde API:', error)
      setError('Error cargando agentes de API: ' + error.message)
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
      
      await loadApiAgents()
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
      console.log('🔄 Creando asignación:', { selectedUser, selectedAgent, agentSource })

      let localAgentId = selectedAgent

      if (agentSource === 'api') {
        // Si es un agente de la API, verificar si ya existe en local
        const selectedApiAgent = apiAgents.find(a => a.id === selectedAgent)
        if (!selectedApiAgent) {
          throw new Error('Agente de API no encontrado')
        }

        // Buscar si ya existe en la base de datos local
        const { data: existingAgent, error: checkError } = await supabase
          .from('agents')
          .select('*')
          .eq('agent_id', selectedAgent)
          .single()

        if (checkError && !checkError.message.includes('No rows found')) {
          throw checkError
        }

        if (!existingAgent) {
          // Crear agente en base de datos local
          const { data: newAgent, error: createError } = await supabase
            .from('agents')
            .insert({
              agent_id: selectedAgent,
              name: selectedApiAgent.name,
              description: selectedApiAgent.description,
              is_active: true,
              is_shared: false
            })
            .select()
            .single()

          if (createError) {
            throw createError
          }

          localAgentId = newAgent.id
          console.log('✅ Agente de API creado en base de datos local')
          
          // Recargar agentes locales
          await loadLocalAgents()
        } else {
          localAgentId = existingAgent.id
        }
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

  // Obtener agentes según la fuente seleccionada
  const availableAgents = agentSource === 'local' ? localAgents : apiAgents

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border w-96">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando asignaciones...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <html lang="es">
      <head>
        <title>Asignaciones de Agentes - Lente AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          .lente-600 { color: #2563eb; }
          .bg-lente-600 { background-color: #2563eb; }
          .bg-lente-100 { background-color: #dbeafe; }
          .text-lente-600 { color: #2563eb; }
          .border-lente-500 { border-color: #3b82f6; }
          .focus\\:ring-lente-500:focus { --tw-ring-color: #3b82f6; }
          .focus\\:border-lente-500:focus { border-color: #3b82f6; }
        `}</style>
      </head>
      <body className="bg-gray-50">
        <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Asignaciones</h1>
              <p className="text-gray-600 mt-2">Asigna agentes a usuarios de la plataforma</p>
            </div>

            {/* Configuración de API */}
            {!isApiConfigured && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Settings className="w-5 h-5 text-yellow-800" />
                  <h3 className="text-lg font-semibold text-yellow-800">Configuración de API de Bravilo</h3>
                </div>
                <p className="text-yellow-700 mb-4">
                  Para usar agentes de la API de Bravilo, configura tu API key
                </p>
                {!showApiConfig ? (
                  <div className="flex items-center space-x-4">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="text-yellow-800">API key no configurada. Solo agentes locales disponibles.</span>
                    <button
                      onClick={() => setShowApiConfig(true)}
                      className="px-4 py-2 border border-yellow-300 rounded-md text-yellow-800 hover:bg-yellow-100 transition-colors"
                    >
                      <Key className="w-4 h-4 inline mr-2" />
                      Configurar API
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key de Bravilo
                      </label>
                      <input
                        type="password"
                        placeholder="Ingresa tu API key de Bravilo"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                      />
                      <p className="text-sm text-gray-600">
                        Obtén tu API key desde <a href="https://app.braviloai.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.braviloai.com</a>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={configureApiKey} 
                        disabled={!apiKey.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Configurar
                      </button>
                      <button 
                        onClick={() => setShowApiConfig(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
            <div className="bg-white rounded-lg shadow-sm border mb-8">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center space-x-2">
                      <Plus className="w-5 h-5" />
                      <span>Nueva Asignación</span>
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Selecciona un usuario y un agente para crear una nueva asignación
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={loadLocalAgents}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-2" />
                      Actualizar Locales
                    </button>
                    {isApiConfigured && (
                      <button
                        onClick={loadApiAgents}
                        disabled={agentsLoading}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 inline mr-2 ${agentsLoading ? 'animate-spin' : ''}`} />
                        Actualizar API
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Usuario
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      Fuente de Agentes
                    </label>
                    <select
                      value={agentSource}
                      onChange={(e) => {
                        setAgentSource(e.target.value as 'local' | 'api')
                        setSelectedAgent('')
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="local">
                        Locales ({localAgents.length})
                      </option>
                      <option value="api" disabled={!isApiConfigured}>
                        API Bravilo ({apiAgents.length})
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agente
                    </label>
                    <select
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={agentsLoading}
                    >
                      <option value="">
                        {agentsLoading ? 'Cargando agentes...' : `Seleccionar agente (${availableAgents.length} disponibles)...`}
                      </option>
                      {availableAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} {agent.description && `- ${agent.description}`}
                        </option>
                      ))}
                    </select>
                    {agentsLoading && (
                      <p className="text-sm text-gray-500 mt-1">Cargando agentes...</p>
                    )}
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={createAssignment}
                      disabled={!selectedUser || !selectedAgent || agentsLoading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Asignar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Asignaciones */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Asignaciones Actuales</span>
                </h2>
                <p className="text-gray-600 mt-1">
                  {assignments.length} asignación{assignments.length !== 1 ? 'es' : ''} activa{assignments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-6">
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
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
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

                          <button
                            onClick={() => deleteAssignment(assignment.user_id, assignment.agent_id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Estado del Sistema */}
            <div className="mt-8 bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Estado del Sistema</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                  <div className="p-3 bg-green-50 rounded">
                    <div className="font-medium text-green-800">API de Bravilo</div>
                    <div className="text-green-600">
                      {isApiConfigured ? '✅ Configurada' : '⚠️ No configurada'}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="font-medium text-blue-800">Agentes Locales</div>
                    <div className="text-blue-600">{localAgents.length} disponibles</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="font-medium text-purple-800">Agentes API</div>
                    <div className="text-purple-600">{apiAgents.length} disponibles</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded">
                    <div className="font-medium text-orange-800">Usuarios</div>
                    <div className="text-orange-600">{users.length} disponibles</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <div className="font-medium text-red-800">Asignaciones</div>
                    <div className="text-red-600">{assignments.length} activas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
