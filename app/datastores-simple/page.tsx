'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database, Plus, Check, AlertCircle, RefreshCw, Trash2, Upload, FileText, File } from 'lucide-react'
import { braviloApiClient } from '@/lib/bravilo-api'

interface Datastore {
  id: string
  name: string
  description?: string
  type: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function DatastoresSimplePage() {
  const [datastores, setDatastores] = useState<Datastore[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isApiConfigured, setIsApiConfigured] = useState(false)
  
  const [newDatastore, setNewDatastore] = useState({
    name: '',
    description: '',
    type: 'text'
  })

  const datastoreTypes = [
    { value: 'text', label: 'Texto', icon: FileText, description: 'Documentos de texto plano' },
    { value: 'pdf', label: 'PDF', icon: File, description: 'Documentos PDF' },
    { value: 'csv', label: 'CSV', icon: Database, description: 'Archivos de datos CSV' },
    { value: 'json', label: 'JSON', icon: File, description: 'Archivos de configuración JSON' }
  ]

  useEffect(() => {
    setIsApiConfigured(braviloApiClient.isApiConfigured())
    loadDatastores()
  }, [])

  async function loadDatastores() {
    try {
      setLoading(true)
      console.log('🔄 Cargando datastores...')
      
      const datastoresData = await braviloApiClient.getDatastores()
      
      setDatastores(datastoresData)
      console.log(`✅ ${datastoresData.length} datastores cargados`)
      
    } catch (error: any) {
      console.error('❌ Error cargando datastores:', error)
      setError('Error cargando datastores: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function createDatastore() {
    if (!newDatastore.name) {
      setError('Por favor ingresa un nombre para el datastore')
      return
    }

    try {
      console.log('🔄 Creando datastore:', newDatastore)
      
      const createdDatastore = await braviloApiClient.createDatastore({
        name: newDatastore.name,
        description: newDatastore.description,
        type: newDatastore.type
      })
      
      setMessage(`✅ Datastore "${newDatastore.name}" creado exitosamente`)
      setNewDatastore({ name: '', description: '', type: 'text' })
      
      await loadDatastores()
      
    } catch (error: any) {
      console.error('❌ Error creando datastore:', error)
      setError('Error creando datastore: ' + error.message)
    }
  }

  async function deleteDatastore(id: string, name: string) {
    if (!confirm(`¿Eliminar el datastore "${name}"?`)) return

    try {
      await braviloApiClient.deleteDatastore(id)
      setMessage(`✅ Datastore "${name}" eliminado`)
      await loadDatastores()
      
    } catch (error: any) {
      setError('Error eliminando datastore: ' + error.message)
    }
  }

  const clearMessages = () => {
    setMessage('')
    setError('')
  }

  const getTypeIcon = (type: string) => {
    const typeData = datastoreTypes.find(t => t.value === type)
    const IconComponent = typeData?.icon || File
    return <IconComponent className="w-5 h-5" />
  }

  const getTypeLabel = (type: string) => {
    const typeData = datastoreTypes.find(t => t.value === type)
    return typeData?.label || type
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🗄️ Gestión de Datastores</h1>
          <p className="text-gray-600 mt-2">Administra las fuentes de datos para tus agentes de IA</p>
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
                  <span>Crear Datastore</span>
                </CardTitle>
                <CardDescription>
                  Agrega una nueva fuente de datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre *</label>
                  <Input
                    value={newDatastore.name}
                    onChange={(e) => setNewDatastore({...newDatastore, name: e.target.value})}
                    placeholder="Mi Datastore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descripción</label>
                  <textarea
                    value={newDatastore.description}
                    onChange={(e) => setNewDatastore({...newDatastore, description: e.target.value})}
                    placeholder="Descripción del datastore..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Datos</label>
                  <div className="space-y-2">
                    {datastoreTypes.map((type) => (
                      <div
                        key={type.value}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          newDatastore.type === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setNewDatastore({...newDatastore, type: type.value})}
                      >
                        <div className="flex items-center space-x-3">
                          <type.icon className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={createDatastore} className="w-full" disabled={!isApiConfigured}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Datastore
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
                    <span>Datastores:</span>
                    <span className="text-blue-600">{datastores.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estado:</span>
                    <span className={loading ? 'text-blue-600' : 'text-green-600'}>
                      {loading ? 'Cargando...' : 'Listo'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de datastores */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Datastores Existentes</span>
                  </CardTitle>
                  <Button onClick={loadDatastores} variant="outline" size="sm" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <CardDescription>
                  {datastores.length} datastore{datastores.length !== 1 ? 's' : ''} disponible{datastores.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando datastores...</p>
                  </div>
                ) : datastores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4" />
                    <p>No hay datastores creados</p>
                    <p className="text-sm mt-2">Crea tu primer datastore usando el formulario</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {datastores.map((datastore) => (
                      <div
                        key={datastore.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {getTypeIcon(datastore.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{datastore.name}</h3>
                              {datastore.description && (
                                <p className="text-sm text-gray-600 mt-1">{datastore.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Database className="w-4 h-4 mr-1" />
                                  {getTypeLabel(datastore.type)}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  datastore.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {datastore.status}
                                </span>
                                <span>
                                  {new Date(datastore.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* TODO: Implementar subida de archivos */}}
                              disabled
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDatastore(datastore.id, datastore.name)}
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
              <a href="/agents" className="p-3 border rounded hover:bg-gray-50 text-center">
                🤖 Agentes
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
