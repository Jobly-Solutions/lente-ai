'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  ArrowLeft, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Link as LinkIcon, 
  Globe, 
  Trash2, 
  RefreshCw,
  Upload,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { braviloApiClient, Datastore, Datasource } from '@/lib/bravilo-api'
import { formatDate } from '@/lib/utils'

export default function DatastoreDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const datastoreId = params.id as string
  
  const [datastore, setDatastore] = useState<Datastore | null>(null)
  const [datasources, setDatasources] = useState<Datasource[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (datastoreId) {
      loadDatastoreDetails()
    }
  }, [datastoreId])

  async function loadDatastoreDetails() {
    try {
      setLoading(true)
      const datastoreData = await braviloApiClient.getDatastore(datastoreId)
      setDatastore(datastoreData)
      
      // Try to get datasources, but don't fail if the function doesn't exist
      try {
        if (typeof braviloApiClient.getDatasourcesByDatastore === 'function') {
          const datasourcesData = await braviloApiClient.getDatasourcesByDatastore(datastoreId)
          setDatasources(datasourcesData)
        } else {
          console.warn('getDatasourcesByDatastore function not available')
          setDatasources([])
        }
      } catch (datasourceError) {
        console.warn('Could not load datasources:', datasourceError)
        setDatasources([])
      }
    } catch (error) {
      console.error('Error loading datastore details:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteDatasource(datasourceId: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este archivo/fuente de datos?')) {
      try {
        setDeleting(datasourceId)
        const success = await braviloApiClient.deleteDatasource(datasourceId)
        if (success) {
          await loadDatastoreDetails() // Reload to get updated data
        } else {
          alert('Error al eliminar el archivo. Por favor, intenta de nuevo.')
        }
      } catch (error) {
        console.error('Error deleting datasource:', error)
        alert('Error al eliminar el archivo. Por favor, intenta de nuevo.')
      } finally {
        setDeleting(null)
      }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="w-4 h-4" />
      case 'página_web':
        return <LinkIcon className="w-4 h-4" />
      case 'sitio_web':
        return <Globe className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'file':
        return 'Archivo'
      case 'página_web':
        return 'Página Web'
      case 'sitio_web':
        return 'Sitio Web'
      default:
        return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synched':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'unsynched':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'synched':
        return 'Sincronizado'
      case 'running':
        return 'Procesando'
      case 'pending':
        return 'Pendiente'
      case 'error':
        return 'Error'
      case 'unsynched':
        return 'No sincronizado'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando detalles del datastore...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!datastore) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Datastore no encontrado</h3>
              <p className="text-gray-600 mb-6">El datastore que buscas no existe o no tienes permisos para verlo.</p>
              <Link href="/datastores">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Datastores
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
      
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/datastores" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Datastores
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Database className="w-8 h-8 mr-3 text-lente-600" />
                  {datastore.name}
                </h1>
                {datastore.description && (
                  <p className="text-gray-600 mt-2">{datastore.description}</p>
                )}
              </div>
              <div className="flex space-x-3">
                <a 
                  href={`https://app.braviloai.com/datastores/${datastore.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Subir Datos
                  </Button>
                </a>
                <Button onClick={loadDatastoreDetails} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>
          </div>

          {/* Datastore Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Información del Datastore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <p className="text-sm text-gray-900">{datastore.type.toUpperCase()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <Badge className={datastore.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {datastore.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Creado</label>
                  <p className="text-sm text-gray-900">{formatDate(datastore.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datasources */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Archivos y Fuentes de Datos</CardTitle>
                  <CardDescription>
                    {datasources.length} archivo{datasources.length !== 1 ? 's' : ''} cargado{datasources.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {datasources.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay archivos cargados</h3>
                  <p className="text-gray-600 mb-6">
                    Este datastore no tiene archivos o fuentes de datos cargadas aún.
                  </p>
                  <a 
                    href={`https://app.braviloai.com/datastores/${datastore.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Primer Archivo
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {datasources.map((datasource) => (
                    <div key={datasource.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(datasource.type)}
                        <div>
                          <h4 className="font-medium text-gray-900">{datasource.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-500">{getTypeLabel(datasource.type)}</span>
                            <Badge className={getStatusColor(datasource.status)}>
                              {getStatusLabel(datasource.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Creado {formatDate(datasource.createdAt)}
                            {datasource.lastSynch && (
                              <span> • Última sincronización: {formatDate(datasource.lastSynch)}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDatasource(datasource.id)}
                        disabled={deleting === datasource.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deleting === datasource.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
