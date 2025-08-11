'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Plus, Check, AlertCircle, RefreshCw, Trash2, Eye, EyeOff, Settings, Globe, Lock } from 'lucide-react'
import { braviloApiClient, Agent as BraviloAgent } from '@/lib/bravilo-api'

export default function AgentsSimplePage() {
  const [agents, setAgents] = useState<BraviloAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isApiConfigured, setIsApiConfigured] = useState(false)
  
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    setIsApiConfigured(braviloApiClient.isApiConfigured())
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      setLoading(true)
      console.log('🔄 Cargando agentes...')
      
      const agentsData = await braviloApiClient.getAgents()
      
      setAgents(agentsData)
      console.log(`✅ ${agentsData.length} agentes cargados`)
      
    } catch (error: any) {
      console.error('❌ Error cargando agentes:', error)
      setError('Error cargando agentes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function createAgent() {
    if (!newAgent.name) {
      setError('Por favor ingresa un nombre para el agente')
      return
    }

    try {
      console.log('🔄 Creando agente:', newAgent)
      
      const createdAgent = await braviloApiClient.createAgent({
        name: newAgent.name,
        description: newAgent.description
      })
      
      setMessage(`✅ Agente "${newAgent.name}" creado exitosamente`)
      setNewAgent({ name: '', description: '' })
      
      await loadAgents()
      
    } catch (error: any) {
      console.error('❌ Error creando agente:', error)
      setError('Error creando agente: ' + error.message)
    }
  }

  async function deleteAgent(id: string, name: string) {
    if (!confirm(`¿Eliminar el agente "${name}"?`)) return

    try {
      await braviloApiClient.deleteAgent(id)
      setMessage(`✅ Agente "${name}" eliminado`)
      await loadAgents()
      
    } catch (error: any) {
      setError('Error eliminando agente: ' + error.message)
    }
  }

  const clearMessages = () => {
    setMessage('')
    setError('')
  }

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'public' ? (
      <Globe className="w-4 h-4 text-green-600" />
    ) : (
      <Lock className="w-4 h-4 text-gray-600" />
    )
  }

  const getStatusIcon = (hidden: boolean) => {
    return hidden ? (
      <EyeOff className="w-4 h-4 text-red-600" />
    ) : (
      <Eye className="w-4 h-4 text-green-600" />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🤖 Gestión de Agentes</h1>
          <p className="text-gray-600 mt-2">Administra tus agentes de inteligencia artificial</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de creación */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Crear Agente</span>
                </CardTitle>
                <CardDescription>
                  Agrega un nuevo agente de IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre *</label>
                  <Input
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                    placeholder="Mi Agente IA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={newAgent.description}
                    onChange={(e) => setNewAgent({...newAgent, description: e.target.value})}
                    placeholder="Descripción del agente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 mb-2">ℹ️ Información</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• El agente se creará en Bravilo</li>
                    <li>• Podrás configurarlo después</li>
                    <li>• Se puede asignar a usuarios</li>
                  </ul>
                </div>

                <Button onClick={createAgent} className="w-full" disabled={!isApiConfigured}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Agente
                </Button>

                {!isApiConfigured && (
                  <p className="text-sm text-yellow-600 text-center">
                    ⚠️ API de Bravilo no configurada
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Estado del sistema */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>📊 Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>API Bravilo:</span>
                    <span className={isApiConfigured ? 'text-green-600' : 'text-yellow-600'}>
                      {isApiConfigured ? '✅ OK' : '⚠️ No config'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Agentes:</span>
                    <span className="text-blue-600">{agents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visibles:</span>
                    <span className="text-green-600">
                      {agents.filter(a => !a.hidden).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Públicos:</span>
                    <span className="text-purple-600">
                      {agents.filter(a => a.visibility === 'public').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de agentes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="w-5 h-5" />
                    <span>Agentes Existentes</span>
                  </CardTitle>
                  <Button onClick={loadAgents} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <CardDescription>
                  {agents.length} agente{agents.length !== 1 ? 's' : ''} disponible{agents.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando agentes...</p>
                  </div>
                ) : agents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-4" />
                    <p>No hay agentes creados</p>
                    <p className="text-sm mt-2">Crea tu primer agente usando el formulario</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Bot className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{agent.name}</h3>
                              {agent.description && (
                                <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2">
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(agent.hidden || false)}
                                  <span className="text-xs text-gray-500">
                                    {agent.hidden ? 'Oculto' : 'Visible'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {getVisibilityIcon(agent.visibility || 'private')}
                                  <span className="text-xs text-gray-500">
                                    {agent.visibility === 'public' ? 'Público' : 'Privado'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(agent.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="mt-2">
                                <span className="text-xs text-gray-400 font-mono">
                                  ID: {agent.id}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Abrir configuración del agente
                                window.open(`https://app.braviloai.com/agents/${agent.id}`, '_blank')
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAgent(agent.id, agent.name)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
              <a href="/admin-simple" className="p-3 border rounded hover:bg-gray-50 text-center">
                🛠️ Admin Panel
              </a>
              <a href="/datastores-simple" className="p-3 border rounded hover:bg-gray-50 text-center">
                🗄️ Datastores
              </a>
              <a href="/" className="p-3 border rounded hover:bg-gray-50 text-center">
                🏠 Dashboard
              </a>
              <a href="/chat" className="p-3 border rounded hover:bg-gray-50 text-center">
                💬 Chat
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
