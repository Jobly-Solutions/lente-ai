'use client'

import { useState } from 'react'

export default function WorkingAdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadUsers() {
    try {
      setLoading(true)
      setMessage('🔄 Cargando usuarios...')
      
      console.log('Iniciando carga de usuarios...')
      
      // Import dynamic para evitar problemas de SSR
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabase = createClient(
        'https://xcoheosfwpaprfmpmume.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU'
      )
      
      console.log('Cliente Supabase creado')
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .order('created_at', { ascending: false })
      
      console.log('Respuesta de Supabase:', { data, error })
      
      if (error) {
        throw new Error(`Error Supabase: ${error.message}`)
      }
      
      setUsers(data || [])
      setMessage(`✅ ${data?.length || 0} usuarios cargados`)
      
    } catch (error: any) {
      console.error('Error cargando usuarios:', error)
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function loadAgents() {
    try {
      setLoading(true)
      setMessage('🔄 Cargando agentes...')
      
      console.log('Iniciando carga de agentes...')
      
      // Import dynamic de axios
      const axios = (await import('axios')).default
      
      const response = await axios.get('https://app.braviloai.com/api/agents', {
        headers: {
          'Authorization': 'Bearer 12895462-fdb8-47df-88f6-0976a4e9436e',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Respuesta de Bravilo:', response.data.length, 'agentes')
      
      const visibleAgents = response.data.filter((agent: any) => !agent.hidden)
      setAgents(visibleAgents)
      setMessage(`✅ ${visibleAgents.length} agentes cargados`)
      
    } catch (error: any) {
      console.error('Error cargando agentes:', error)
      setMessage(`❌ Error agentes: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function createAssignment() {
    if (!selectedUser || !selectedAgent) {
      setMessage('❌ Selecciona usuario y agente')
      return
    }

    try {
      setLoading(true)
      setMessage('🔄 Creando asignación...')
      
      // Import dynamic para evitar problemas de SSR
      const { createClient } = await import('@supabase/supabase-js')
      
      const supabase = createClient(
        'https://xcoheosfwpaprfmpmume.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU'
      )
      
      // Buscar agente
      const agentData = agents.find(a => a.id === selectedAgent)
      if (!agentData) throw new Error('Agente no encontrado')

      // Verificar si existe en la base local
      let { data: localAgent, error: checkError } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_id', selectedAgent)
        .single()

      // Crear agente local si no existe
      if (checkError || !localAgent) {
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

      setMessage('✅ Asignación creada exitosamente!')
      setSelectedUser('')
      setSelectedAgent('')
      
    } catch (error: any) {
      console.error('Error creando asignación:', error)
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            💪 Panel de Admin - GARANTIZADO QUE FUNCIONA
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button
              onClick={loadUsers}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              👥 Cargar Usuarios ({users.length})
            </button>
            
            <button
              onClick={loadAgents}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              🤖 Cargar Agentes ({agents.length})
            </button>
            
            <button
              onClick={createAssignment}
              disabled={loading || !selectedUser || !selectedAgent}
              className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              ⚡ Crear Asignación
            </button>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <div className="font-mono text-sm">{message}</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Selector de Usuario */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">👥 Seleccionar Usuario</h2>
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
              
              <div className="text-sm text-gray-600">
                {users.length === 0 ? 'Haz clic en "Cargar Usuarios"' : `${users.length} usuarios disponibles`}
              </div>
            </div>

            {/* Selector de Agente */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">🤖 Seleccionar Agente</h2>
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
              
              <div className="text-sm text-gray-600">
                {agents.length === 0 ? 'Haz clic en "Cargar Agentes"' : `${agents.length} agentes disponibles`}
              </div>
            </div>
          </div>

          {/* Lista de Usuarios */}
          {users.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">👥 Usuarios Cargados ({users.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {users.map((user) => (
                  <div key={user.id} className="p-3 bg-blue-50 rounded border">
                    <div className="font-medium">{user.full_name || 'Sin nombre'}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500">Rol: {user.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Agentes */}
          {agents.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">🤖 Agentes Cargados ({agents.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-3 bg-green-50 rounded border">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-gray-500 font-mono">ID: {agent.id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">📋 Instrucciones:</h3>
            <ol className="text-yellow-700 text-sm space-y-1">
              <li>1. Haz clic en "👥 Cargar Usuarios" para ver los usuarios</li>
              <li>2. Haz clic en "🤖 Cargar Agentes" para ver los agentes</li>
              <li>3. Selecciona un usuario y un agente</li>
              <li>4. Haz clic en "⚡ Crear Asignación"</li>
            </ol>
          </div>

          {/* Enlaces */}
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/admin-simple" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              🛠️ Admin Original
            </a>
            <a href="/dashboard-complete" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              🏠 Dashboard
            </a>
            <a href="/fix-users" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              🔧 Fix Users
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
