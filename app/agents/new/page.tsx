'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { braviloApiClient } from '@/lib/bravilo-api'
import { useEffect } from 'react'

export default function NewAgentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [datastores, setDatastores] = useState<{ id: string; name: string }[]>([])
  const [selectedDatastoreIds, setSelectedDatastoreIds] = useState<string[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const list = await braviloApiClient.getDatastores() as any[]
        const simplified = (list || []).map((d: any) => ({ id: d.id, name: d.name }))
        setDatastores(simplified)
      } catch (e) {
        console.error('Error loading datastores:', e)
      }
    })()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const agent = await braviloApiClient.createAgent(formData)
      // If admin selected datastores, attach them to the agent as tools
      if (agent?.id && selectedDatastoreIds.length > 0) {
        const tools = selectedDatastoreIds.map((id) => ({ type: 'datastore', datastoreId: id }))
        // Update agent with tools via proxy
        await fetch(`/api/agents/${agent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tools }),
        })
      }
      router.push('/agents')
    } catch (error) {
      console.error('Error creating agent:', error)
      alert('Error al crear el agente. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Agente</h1>
          <p className="text-gray-600 mt-2">Configura un nuevo agente de inteligencia artificial</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-lente-600" />
              <CardTitle>Información del Agente</CardTitle>
            </div>
            <CardDescription>
              Completa la información básica para crear tu nuevo agente de IA
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Información Importante</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• El agente se creará con la configuración básica</li>
                  <li>• Podrás personalizar su comportamiento después de la creación</li>
                  <li>• El agente estará inactivo por defecto hasta que lo actives</li>
                  <li>• Puedes conectarlo a datastores ahora o más tarde</li>
                </ul>
              </div>

              {/* Datastore selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asignar Datastores (opcional)</label>
                {datastores.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay datastores disponibles. Crea uno primero.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {datastores.map((ds) => {
                      const checked = selectedDatastoreIds.includes(ds.id)
                      return (
                        <label key={ds.id} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const isChecked = e.target.checked
                              setSelectedDatastoreIds((prev) => (
                                isChecked ? [...prev, ds.id] : prev.filter((id) => id !== ds.id)
                              ))
                            }}
                          />
                          <span>{ds.name}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/agents">
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={loading || !formData.name.trim()}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Crear Agente
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
