'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database, Plus, Search, Trash2, FileText, FileSpreadsheet, FileCode } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { braviloApiClient, Datastore } from '@/lib/bravilo-api'
import { formatDate } from '@/lib/utils'

export default function DatastoresPage() {
  const [datastores, setDatastores] = useState<Datastore[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadDatastores()
  }, [])

  async function loadDatastores() {
    try {
      const datastoresData = await braviloApiClient.getDatastores()
      setDatastores(datastoresData)
    } catch (error) {
      console.error('Error loading datastores:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteDatastore(datastoreId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este datastore?')) {
      try {
        await braviloApiClient.deleteDatastore(datastoreId)
        await loadDatastores() // Reload to get updated data
      } catch (error) {
        console.error('Error deleting datastore:', error)
      }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4" />
      case 'json':
        return <FileCode className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'PDF'
      case 'csv':
        return 'CSV'
      case 'json':
        return 'JSON'
      case 'text':
        return 'Texto'
      default:
        return type.toUpperCase()
    }
  }

  const filteredDatastores = datastores.filter(datastore =>
    datastore.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    datastore.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Datastores</h1>
            <p className="text-gray-600 mt-2">Gestiona las fuentes de datos para tus agentes</p>
          </div>
          <Link href="/datastores/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Crear Datastore
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar datastores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Datastores Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando datastores...</p>
          </div>
        ) : filteredDatastores.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron datastores' : 'No hay datastores creados'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza creando tu primer datastore para alimentar tus agentes'
                }
              </p>
              {!searchTerm && (
                <Link href="/datastores/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Datastore
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDatastores.map((datastore) => (
              <Card key={datastore.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="w-5 h-5 text-lente-600" />
                      <CardTitle className="text-lg">{datastore.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDatastore(datastore.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {datastore.description && (
                    <CardDescription>{datastore.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(datastore.type)}
                      <span className="font-medium">{getTypeLabel(datastore.type)}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      datastore.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {datastore.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Creado {formatDate(datastore.createdAt)}
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/datastores/${datastore.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Ver Detalles
                      </Button>
                    </Link>
                    <a 
                      href={`https://app.braviloai.com/datastores/${datastore.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="ghost" size="sm" className="w-full">
                        Subir Datos
                      </Button>
                    </a>
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
