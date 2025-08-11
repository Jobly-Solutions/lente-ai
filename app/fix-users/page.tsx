'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Users, Bot, Plus } from 'lucide-react'
import { braviloApiClient } from '@/lib/bravilo-api'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  full_name?: string
  role: string
}

interface Agent {
  id: string
  name: string
  description?: string
  hidden?: boolean
}

export default function FixUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('🔄 Iniciando carga de datos...')
    loadEverything()
  }, [])

  async function loadEverything() {
    setLoading(true)
    setError('')
    
    try {
      console.log('🔄 Cargando usuarios y agentes...')
      
      // Cargar usuarios directamente
      console.log('👥 Cargando usuarios...')
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('❌ Error usuarios:', usersError)
        throw new Error('Error cargando usuarios: ' + usersError.message)
      }

      console.log('✅ Usuarios obtenidos:', usersData.length)
      setUsers(usersData || [])

      // Cargar agentes
      console.log('🤖 Cargando agentes...')
      try {
        const agentsData = await braviloApiClient.getAgents()
        const visibleAgents = agentsData.filter(agent => !agent.hidden)
        console.log('✅ Agentes obtenidos:', visibleAgents.length)
        setAgents(visibleAgents)
      } catch (agentError: any) {
        console.error('❌ Error agentes:', agentError)
        setError('Error cargando agentes: ' + agentError.message)
      }

      setMessage('✅ Datos cargados exitosamente')
      
    } catch (error: any) {
      console.error('❌ Error general:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function createAssignment() {
    if (!selectedUser || !selectedAgent) {
      setError('Selecciona usuario y agente')
      return
    }

    try {
      setLoading(true)
      console.log('🔄 Creando asignación...', { selectedUser, selectedAgent })

      // Buscar datos del agente
      const agentData = agents.find(a => a.id === selectedAgent)
      if (!agentData) throw new Error('Agente no encontrado')

      // Verificar si el agente existe en la base local
      let { data: localAgent, error: checkError } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_id', selectedAgent)
        .single()

      if (checkError && !checkError.message.includes('No rows found')) {
        throw checkError
      }

      // Crear agente local si no existe
      if (!localAgent) {
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            agent_id: selectedAgent,
            name: agentData.name,
            description: agentData.description || '',
            is_active: true,
            is_shared: false
          })
          .select()
          .single()

        if (createError) throw createError
        localAgent = newAgent
      }

      // Crear asignación
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          user_id: selectedUser,
          agent_id: localAgent.id
        })

      if (assignmentError) throw assignmentError

      setMessage('✅ Asignación creada exitosamente')
      setSelectedUser('')
      setSelectedAgent('')
      
    } catch (error: any) {
      console.error('❌ Error creando asignación:', error)
      setError('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔧 Sistema de Asignaciones - FUNCIONAL</h1>
          <p className="text-gray-600 mt-2">Asigna agentes a usuarios de forma directa</p>
        </div>

        {/* Messages */}
        {(message || error) && (
          <div className="mb-6">
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Asignación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Crear Asignación</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selector de Usuario */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Usuario ({users.length} disponibles)
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={loading}
                >
                  <option value="">Seleccionar usuario...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || 'Sin nombre'} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Agente */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Agente ({agents.length} disponibles)
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={loading}
                >
                  <option value="">Seleccionar agente...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="flex space-x-2">
                <Button 
                  onClick={createAssignment} 
                  className="flex-1"
                  disabled={loading || !selectedUser || !selectedAgent}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Creando...' : 'Crear Asignación'}
                </Button>
                <Button onClick={loadEverything} variant="outline" disabled={loading}>
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Panel de Estado */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Usuarios</span>
                  </div>
                  <span className="text-blue-600 font-bold">{users.length}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Agentes</span>
                  </div>
                  <span className="text-green-600 font-bold">{agents.length}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="font-medium">API Bravilo</span>
                  <span className="text-purple-600">
                    {braviloApiClient.isApiConfigured() ? '✅ OK' : '❌ Error'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                  <span className="font-medium">Estado</span>
                  <span className="text-orange-600">
                    {loading ? 'Cargando...' : 'Listo'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Usuarios */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>👥 Usuarios Disponibles ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {loading ? 'Cargando usuarios...' : 'No hay usuarios'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div key={user.id} className="p-3 border rounded bg-gray-50">
                    <div className="font-medium">{user.full_name || 'Sin nombre'}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500">Rol: {user.role}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Agentes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🤖 Agentes Disponibles ({agents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {loading ? 'Cargando agentes...' : 'No hay agentes'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-3 border rounded bg-gray-50">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-gray-500 font-mono">ID: {agent.id}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enlaces */}
        <div className="mt-8 flex flex-wrap gap-4">
          <a href="/admin-simple" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            🛠️ Panel Admin Original
          </a>
          <a href="/dashboard-complete" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            🏠 Dashboard
          </a>
          <a href="/test-everything" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            🧪 Pruebas
          </a>
        </div>
      </div>
    </div>
  )
}
