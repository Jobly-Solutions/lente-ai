'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Plus, Search, Edit, Trash2, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { braviloApiClient, Agent } from '@/lib/bravilo-api'
import { formatDate } from '@/lib/utils'

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      const agentsData = await braviloApiClient.getAgents()
      setAgents(agentsData)
      
      // Check if we're using fallback agents (they have specific IDs)
      const isUsingFallback = agentsData.some(agent => agent.id.startsWith('fallback-'))
      setUsingFallback(isUsingFallback)
    } catch (error) {
      console.error('Error loading agents:', error)
      // The API client should return fallback agents, but just in case
      setAgents([])
      setUsingFallback(true)
    } finally {
      setLoading(false)
    }
  }

  async function toggleAgentStatus(agentId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
      await braviloApiClient.updateAgent(agentId, { status: newStatus })
      await loadAgents() // Reload to get updated data
    } catch (error) {
      console.error('Error updating agent status:', error)
    }
  }

  async function deleteAgent(agentId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este agente?')) {
      try {
        await braviloApiClient.deleteAgent(agentId)
        await loadAgents() // Reload to get updated data
      } catch (error) {
        console.error('Error deleting agent:', error)
      }
    }
  }

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agentes</h1>
            <p className="text-gray-600 mt-2">Gestiona tus agentes de inteligencia artificial</p>
          </div>
          <Link href="/agents/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Crear Agente
            </Button>
          </Link>
        </div>

        {/* Fallback Warning */}
        {usingFallback && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Modo de demostración
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    No se pudo conectar con la API de Bravilo. Se están mostrando agentes de demostración.
                    Verifica tu conexión a internet y la configuración de la API.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar agentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Agents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando agentes...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron agentes' : 'No hay agentes creados'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando tu primer agente de IA'
                }
              </p>
              {!searchTerm && (
                <Link href="/agents/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Agente
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-5 h-5 text-lente-600" />
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAgentStatus(agent.id, agent.status || 'inactive')}
                        className="p-1"
                      >
                        {agent.status === 'active' ? (
                          <Pause className="w-4 h-4 text-green-600" />
                        ) : (
                          <Play className="w-4 h-4 text-gray-600" />
                        )}
                      </Button>
                      <Link href={`/agents/${agent.id}/edit`}>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAgent(agent.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {agent.description && (
                    <CardDescription>{agent.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agent.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                    <span>Creado {formatDate(agent.createdAt)}</span>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <Link href={`/chat?agent=${agent.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Probar Chat
                      </Button>
                    </Link>
                    <Link href={`/agents/${agent.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        Ver Detalles
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
    </ProtectedRoute>
  )
}
