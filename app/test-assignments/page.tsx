'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Users, Plus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { braviloApiClient, Agent as BraviloAgent } from '@/lib/bravilo-api'

export default function TestAssignmentsPage() {
  const [agents, setAgents] = useState<BraviloAgent[]>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [apiConfigured, setApiConfigured] = useState(false)

  useEffect(() => {
    setApiConfigured(braviloApiClient.isApiConfigured())
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      setAgentsLoading(true)
      setError('')
      console.log('🔄 Cargando agentes desde API de Bravilo...')

      const agentsData = await braviloApiClient.getAgents()
      
      // Filtrar solo agentes activos
      const activeAgents = agentsData.filter(agent => agent.status === 'active')
      
      console.log(`✅ ${activeAgents.length} agentes activos cargados`)
      
      setAgents(activeAgents)
      setSuccessMessage(`${activeAgents.length} agentes cargados correctamente`)
      
    } catch (error: any) {
      console.error('❌ Error cargando agentes:', error)
      setError('Error cargando agentes: ' + error.message)
      setAgents([])
    } finally {
      setAgentsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🧪 Test de Asignaciones - Lente AI</h1>
          <p className="text-gray-600 mt-2">Página de prueba para verificar la carga de agentes desde Bravilo</p>
        </div>

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

        {/* Mensajes */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        {/* Control de carga */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5" />
                  <span>Carga de Agentes</span>
                </CardTitle>
                <CardDescription>
                  Prueba la conexión con la API de Bravilo
                </CardDescription>
              </div>
              <Button
                onClick={loadAgents}
                disabled={agentsLoading}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${agentsLoading ? 'animate-spin' : ''}`} />
                {agentsLoading ? 'Cargando...' : 'Recargar Agentes'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Lista de Agentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>Agentes Disponibles</span>
            </CardTitle>
            <CardDescription>
              {agents.length} agente{agents.length !== 1 ? 's' : ''} encontrado{agents.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando agentes...</p>
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-12 h-12 mx-auto mb-4" />
                <p>No hay agentes disponibles</p>
                <p className="text-sm mt-2">Verifica la configuración de la API</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-lente-100 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-lente-600" />
                      </div>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-gray-500">
                          {agent.description || 'Sin descripción'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          Estado: {agent.status}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {agent.id}
                        </div>
                      </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-green-50 rounded">
                <div className="font-medium text-green-800">API de Bravilo</div>
                <div className="text-green-600">
                  {apiConfigured ? '✅ Configurada' : '⚠️ No configurada'}
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="font-medium text-blue-800">Agentes</div>
                <div className="text-blue-600">{agents.length} disponibles</div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <div className="font-medium text-purple-800">Entorno</div>
                <div className="text-purple-600">Desarrollo</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📋 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>1. Puerto correcto:</strong> Usa <code>http://localhost:3001</code> (no 3000)</p>
              <p><strong>2. Página principal:</strong> <a href="/admin/assignments" className="text-blue-600 hover:underline">http://localhost:3001/admin/assignments</a></p>
              <p><strong>3. Crear usuarios:</strong> <a href="/users/new" className="text-blue-600 hover:underline">http://localhost:3001/users/new</a></p>
              <p><strong>4. API:</strong> {apiConfigured ? 'Configurada correctamente' : 'Usando agentes de demostración'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
