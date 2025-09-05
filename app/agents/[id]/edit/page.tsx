'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { braviloApiClient, Agent } from '@/lib/bravilo-api'

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    userPrompt: '{query}', // Valor fijo
    modelName: 'gpt_4o_mini' as 'gpt_4o_mini', // Valor fijo
    temperature: 0, // Valor fijo
    visibility: 'public' as 'public' | 'private'
  })

  useEffect(() => {
    if (agentId) {
      loadAgent()
    }
  }, [agentId])

  async function loadAgent() {
    try {
      setLoading(true)
      const agentData = await braviloApiClient.getAgent(agentId)
      setAgent(agentData)
      
      // Populate form with agent data
      setFormData({
        name: agentData.name || '',
        description: agentData.description || '',
        systemPrompt: agentData.systemPrompt || '',
        userPrompt: agentData.userPrompt || '{query}',
        modelName: (agentData.modelName as 'gpt_4o_mini') || 'gpt_4o_mini',
        temperature: agentData.temperature || 0,
        visibility: (agentData.visibility as 'public' | 'private') || 'public'
      })
    } catch (error) {
      console.error('Error loading agent:', error)
      alert('Error al cargar el agente. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await braviloApiClient.updateAgent(agentId, {
        name: formData.name,
        description: formData.description,
        systemPrompt: formData.systemPrompt,
        userPrompt: formData.userPrompt,
        modelName: formData.modelName,
        temperature: formData.temperature,
        visibility: formData.visibility
      })
      
      router.push('/agents')
    } catch (error) {
      console.error('Error updating agent:', error)
      alert('Error al actualizar el agente. Por favor, intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando agente...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!agent) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Agente no encontrado</h3>
              <p className="text-gray-600 mb-6">El agente que buscas no existe o no tienes permisos para editarlo.</p>
              <Link href="/agents">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Agentes
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Header />
      
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link href="/agents" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Agentes
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Editar Agente</h1>
            <p className="text-gray-600 mt-2">Modifica la configuración de tu agente de inteligencia artificial</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Bot className="w-6 h-6 text-lente-600" />
                <CardTitle>Configuración del Agente</CardTitle>
              </div>
              <CardDescription>
                Actualiza la información y configuración de tu agente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Agente *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Asistente de Ventas"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Elige un nombre descriptivo para tu agente
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe el propósito y capacidades de tu agente..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lente-500 focus:border-lente-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Opcional: Proporciona una descripción detallada del agente
                  </p>
                </div>

                {/* Hidden fields for fixed values */}
                <input type="hidden" name="modelName" value={formData.modelName} />
                <input type="hidden" name="temperature" value={formData.temperature} />
                <input type="hidden" name="userPrompt" value={formData.userPrompt} />

                {/* Prompt Configuration */}
                <div>
                  <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt del Sistema
                  </label>
                  <textarea
                    id="systemPrompt"
                    name="systemPrompt"
                    value={formData.systemPrompt}
                    onChange={handleInputChange}
                    placeholder="Eres un asistente de IA especializado en... Define el rol y comportamiento del agente aquí."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lente-500 focus:border-lente-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Define el rol, personalidad y comportamiento del agente. Este prompt se ejecuta en cada conversación.
                  </p>
                </div>

                <div>
                  <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
                    Visibilidad
                  </label>
                  <select
                    id="visibility"
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lente-500 focus:border-lente-500"
                  >
                    <option value="public">Público</option>
                    <option value="private">Privado</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Los agentes públicos pueden ser usados por todos los usuarios, los privados solo por administradores.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Configuración Fija</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Modelo:</strong> GPT-4o Mini (optimizado y eficiente)</li>
                    <li>• <strong>Temperatura:</strong> 0 (máxima precisión y consistencia)</li>
                    <li>• <strong>Prompt de Usuario:</strong> {`{query}`} (se reemplaza automáticamente)</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <Link href="/agents">
                    <Button variant="outline" type="button">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" disabled={saving || !formData.name.trim()}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
