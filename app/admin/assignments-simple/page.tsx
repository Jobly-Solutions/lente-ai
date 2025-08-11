'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Users, Search, Plus, Trash2, RefreshCw } from 'lucide-react'

// Fallback agents for testing
const FALLBACK_AGENTS = [
  {
    id: 'fallback-support',
    name: 'Agente de Soporte',
    description: 'Agente especializado en atención al cliente',
    status: 'active',
  },
  {
    id: 'fallback-sales',
    name: 'Agente de Ventas',
    description: 'Agente especializado en ventas y consultas comerciales',
    status: 'active',
  },
  {
    id: 'fallback-hr',
    name: 'Agente de RRHH',
    description: 'Agente especializado en recursos humanos',
    status: 'active',
  },
  {
    id: 'fallback-finance',
    name: 'Agente Financiero',
    description: 'Agente especializado en finanzas y contabilidad',
    status: 'active',
  },
  {
    id: 'fallback-marketing',
    name: 'Agente de Marketing',
    description: 'Agente especializado en marketing digital',
    status: 'active',
  },
]

export default function SimpleAssignmentsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setError('')
      console.log('🔄 Cargando datos...')

      // Usar agentes de fallback directamente
      setAgents(FALLBACK_AGENTS)
      console.log('✅ Agentes cargados (fallback)')

      // Simular usuarios
      const mockUsers = [
        { id: 'user1', full_name: 'JC Falcon', email: 'jc.falcon@lenteconsulting.com' },
        { id: 'user2', full_name: 'Admin Test', email: 'admin@test.com' },
        { id: 'user3', full_name: 'Test User', email: 'test@example.com' },
      ]
      setUsers(mockUsers)
      console.log('✅ Usuarios cargados (mock)')

      // Simular asignaciones
      const mockAssignments = [
        {
          user_id: 'user1',
          agent_id: 'fallback-support',
          assigned_at: new Date().toISOString(),
          profiles: { full_name: 'JC Falcon', email: 'jc.falcon@lenteconsulting.com' },
          agents: { name: 'Agente de Soporte', description: 'Atención al cliente' }
        }
      ]
      setAssignments(mockAssignments)
      console.log('✅ Asignaciones cargadas (mock)')

    } catch (error: any) {
      console.error('❌ Error cargando datos:', error)
      setError(error.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }

  async function createAssignment() {
    if (!selectedUser || !selectedAgent) {
      setError('Por favor selecciona un usuario y un agente')
      return
    }

    try {
      setError('')
      console.log('🔄 Creando asignación:', { selectedUser, selectedAgent })

      const user = users.find(u => u.id === selectedUser)
      const agent = agents.find(a => a.id === selectedAgent)

      if (!user || !agent) {
        throw new Error('Usuario o agente no encontrado')
      }

      const newAssignment = {
        user_id: selectedUser,
        agent_id: selectedAgent,
        assigned_at: new Date().toISOString(),
        profiles: { full_name: user.full_name, email: user.email },
        agents: { name: agent.name, description: agent.description }
      }

      setAssignments(prev => [newAssignment, ...prev])
      setSelectedUser('')
      setSelectedAgent('')
      
      console.log('✅ Asignación creada exitosamente')
    } catch (error: any) {
      console.error('❌ Error creando asignación:', error)
      setError(error.message || 'Error al crear la asignación')
    }
  }

  async function deleteAssignment(userId: string, agentId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta asignación?')) return

    try {
      setError('')
      console.log('🔄 Eliminando asignación:', { userId, agentId })

      setAssignments(prev => prev.filter(a => !(a.user_id === userId && a.agent_id === agentId)))
      
      console.log('✅ Asignación eliminada exitosamente')
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Asignaciones (Simple)</h1>
          <p className="text-gray-600 mt-2">Versión simplificada para pruebas</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
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
                  Selecciona un usuario y un agente para crear una nueva asignación
                </CardDescription>
              </div>
              <Button
                onClick={loadData}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar
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
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agente
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-lente-500 focus:border-lente-500"
                >
                  <option value="">Seleccionar agente...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} - {agent.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={createAssignment}
                  disabled={!selectedUser || !selectedAgent}
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
                          Asignado {new Date(assignment.assigned_at).toLocaleDateString()}
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

        {/* Información de Debug */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Información de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Usuarios:</strong> {users.length}
              </div>
              <div>
                <strong>Agentes:</strong> {agents.length}
              </div>
              <div>
                <strong>Asignaciones:</strong> {assignments.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
