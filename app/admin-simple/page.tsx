'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Users, Database, Plus, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react'
import { braviloApiClient, Agent as BraviloAgent } from '@/lib/bravilo-api'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  full_name?: string
  role: string
  created_at: string
}

interface Assignment {
  user_id: string
  agent_id: string
  assigned_at: string
  user_email?: string
  user_name?: string
  agent_name?: string
}

export default function AdminSimplePage() {
  // Estados para agentes
  const [agents, setAgents] = useState<BraviloAgent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  
  // Estados para usuarios
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  
  // Estados para asignaciones
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  
  // Estados para crear usuario
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: 'temp123',
    role: 'user'
  })
  
  // Estados para crear asignación
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  
  // Estados generales
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isApiConfigured, setIsApiConfigured] = useState(false)

  useEffect(() => {
    setIsApiConfigured(braviloApiClient.isApiConfigured())
    loadAll()
  }, [])

  async function loadAll() {
    await Promise.all([
      loadAgents(),
      loadUsers(),
      loadAssignments()
    ])
  }

  async function loadAgents() {
    try {
      setAgentsLoading(true)
      console.log('🔄 Cargando agentes...')
      
      const agentsData = await braviloApiClient.getAgents()
      const visibleAgents = agentsData.filter(agent => !agent.hidden)
      
      setAgents(visibleAgents)
      console.log(`✅ ${visibleAgents.length} agentes cargados`)
      
    } catch (error: any) {
      console.error('❌ Error cargando agentes:', error)
      setError('Error cargando agentes: ' + error.message)
    } finally {
      setAgentsLoading(false)
    }
  }

  async function loadUsers() {
    try {
      setUsersLoading(true)
      console.log('🔄 Cargando usuarios...')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
      console.log(`✅ ${data?.length || 0} usuarios cargados`)
      
    } catch (error: any) {
      console.error('❌ Error cargando usuarios:', error)
      setError('Error cargando usuarios: ' + error.message)
    } finally {
      setUsersLoading(false)
    }
  }

  async function loadAssignments() {
    try {
      setAssignmentsLoading(true)
      console.log('🔄 Cargando asignaciones...')
      
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          profiles!assignments_user_id_fkey(id, full_name, email),
          agents!assignments_agent_id_fkey(id, name)
        `)
        .order('assigned_at', { ascending: false })

      if (error) throw error

      const formattedAssignments = (data || []).map(assignment => ({
        user_id: assignment.user_id,
        agent_id: assignment.agent_id,
        assigned_at: assignment.assigned_at,
        user_email: assignment.profiles?.email,
        user_name: assignment.profiles?.full_name,
        agent_name: assignment.agents?.name
      }))

      setAssignments(formattedAssignments)
      console.log(`✅ ${formattedAssignments.length} asignaciones cargadas`)
      
    } catch (error: any) {
      console.error('❌ Error cargando asignaciones:', error)
      setError('Error cargando asignaciones: ' + error.message)
    } finally {
      setAssignmentsLoading(false)
    }
  }

  async function createUser() {
    if (!newUser.email || !newUser.name) {
      setError('Por favor completa email y nombre')
      return
    }

    try {
      console.log('🔄 Creando usuario:', newUser.email)
      
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      })

      if (authError) throw authError

      // Crear perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          full_name: newUser.name,
          role: newUser.role
        })

      if (profileError) throw profileError

      setMessage(`✅ Usuario ${newUser.email} creado exitosamente`)
      setNewUser({ email: '', name: '', password: 'temp123', role: 'user' })
      
      await loadUsers()
      
    } catch (error: any) {
      console.error('❌ Error creando usuario:', error)
      setError('Error creando usuario: ' + error.message)
    }
  }

  async function createAssignment() {
    if (!selectedUser || !selectedAgent) {
      setError('Por favor selecciona usuario y agente')
      return
    }

    try {
      console.log('🔄 Creando asignación:', { selectedUser, selectedAgent })
      
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
            description: agentData.description,
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

      setMessage(`✅ Asignación creada exitosamente`)
      setSelectedUser('')
      setSelectedAgent('')
      
      await loadAssignments()
      
    } catch (error: any) {
      console.error('❌ Error creando asignación:', error)
      setError('Error creando asignación: ' + error.message)
    }
  }

  async function deleteAssignment(userId: string, agentId: string) {
    if (!confirm('¿Eliminar esta asignación?')) return

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('user_id', userId)
        .eq('agent_id', agentId)

      if (error) throw error

      setMessage('✅ Asignación eliminada')
      await loadAssignments()
      
    } catch (error: any) {
      setError('Error eliminando asignación: ' + error.message)
    }
  }

  const clearMessages = () => {
    setMessage('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🛠️ Panel de Administración Simple</h1>
          <p className="text-gray-600 mt-2">Gestión completa de usuarios, agentes y asignaciones</p>
        </div>

        {/* Mensajes */}
        {(message || error) && (
          <div className="mb-6">
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  {message}
                </div>
                <button onClick={clearMessages} className="text-green-700 hover:text-green-800">×</button>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
                <button onClick={clearMessages} className="text-red-700 hover:text-red-800">×</button>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo */}
          <div className="space-y-6">
            {/* Estado del Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Estado del Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="font-medium text-blue-800">API Bravilo</div>
                    <div className="text-blue-600">
                      {isApiConfigured ? '✅ Configurada' : '⚠️ No configurada'}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <div className="font-medium text-green-800">Agentes</div>
                    <div className="text-green-600">{agents.length} disponibles</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="font-medium text-purple-800">Usuarios</div>
                    <div className="text-purple-600">{users.length} registrados</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded">
                    <div className="font-medium text-orange-800">Asignaciones</div>
                    <div className="text-orange-600">{assignments.length} activas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crear Usuario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Crear Usuario</span>
                </CardTitle>
                <CardDescription>Agrega un nuevo usuario al sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rol</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <Button onClick={createUser} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
              </CardContent>
            </Card>

            {/* Crear Asignación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5" />
                  <span>Crear Asignación</span>
                </CardTitle>
                <CardDescription>Asigna un agente a un usuario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Usuario</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
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
                  <label className="block text-sm font-medium mb-1">Agente</label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={agentsLoading}
                  >
                    <option value="">
                      {agentsLoading ? 'Cargando...' : 'Seleccionar agente...'}
                    </option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={createAssignment} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Asignar
                  </Button>
                  <Button onClick={loadAgents} variant="outline" disabled={agentsLoading}>
                    <RefreshCw className={`w-4 h-4 ${agentsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho */}
          <div className="space-y-6">
            {/* Lista de Usuarios */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Usuarios Registrados</CardTitle>
                  <Button onClick={loadUsers} variant="outline" size="sm" disabled={usersLoading}>
                    <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Cargando usuarios...</p>
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay usuarios registrados</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
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

            {/* Lista de Asignaciones */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Asignaciones Activas</CardTitle>
                  <Button onClick={loadAssignments} variant="outline" size="sm" disabled={assignmentsLoading}>
                    <RefreshCw className={`w-4 h-4 ${assignmentsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {assignmentsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Cargando asignaciones...</p>
                  </div>
                ) : assignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay asignaciones</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {assignments.map((assignment) => (
                      <div key={`${assignment.user_id}-${assignment.agent_id}`} className="p-3 border rounded bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{assignment.user_name || 'Usuario'}</div>
                            <div className="text-sm text-gray-600">{assignment.agent_name || 'Agente'}</div>
                            <div className="text-xs text-gray-500">{assignment.user_email}</div>
                          </div>
                          <Button
                            onClick={() => deleteAssignment(assignment.user_id, assignment.agent_id)}
                            variant="ghost"
                            size="sm"
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
          </div>
        </div>

        {/* Navegación */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🔗 Enlaces Útiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/" className="p-3 border rounded hover:bg-gray-50 text-center">
                🏠 Dashboard
              </a>
              <a href="/auth/login" className="p-3 border rounded hover:bg-gray-50 text-center">
                🔐 Login
              </a>
              <a href="/chat" className="p-3 border rounded hover:bg-gray-50 text-center">
                💬 Chat
              </a>
              <a href="/agents" className="p-3 border rounded hover:bg-gray-50 text-center">
                🤖 Agentes
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
