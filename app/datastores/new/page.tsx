'use client'

import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database, ArrowLeft, Save, FileText, FileSpreadsheet, FileCode, Upload, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { braviloApiClient } from '@/lib/bravilo-api'

export default function NewDatastorePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [uploadType, setUploadType] = useState<'none' | 'file' | 'web_page' | 'web_site'>('none')
  const [file, setFile] = useState<File | null>(null)
  const [urlName, setUrlName] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [sitemapUrl, setSitemapUrl] = useState('')

  // Bravilo requiere type='qdrant' para crear datastores

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const datastore = await braviloApiClient.createDatastore({
        name: formData.name,
        description: formData.description,
        type: 'qdrant',
      })

      // Optional immediate datasource creation
      if (uploadType === 'file' && file) {
        await braviloApiClient.createDatasourceFile({
          datastoreId: (datastore as any).id,
          file,
          fileName: file.name,
        })
      } else if (uploadType === 'web_page' && urlValue.trim()) {
        await braviloApiClient.createDatasourceWebPage({
          datastoreId: (datastore as any).id,
          name: urlName || 'Página web',
          sourceUrl: urlValue.trim(),
        })
      } else if (uploadType === 'web_site' && (sitemapUrl.trim() || urlValue.trim())) {
        await braviloApiClient.createDatasourceWebSite({
          datastoreId: (datastore as any).id,
          name: urlName || 'Sitio web',
          sitemap: sitemapUrl.trim() || undefined,
          sourceUrl: urlValue.trim() || undefined,
        })
      }

      router.push('/datastores')
    } catch (error) {
      console.error('Error creating datastore:', error)
      alert('Error al crear el datastore. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          <Link href="/datastores" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Datastores
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Datastore</h1>
          <p className="text-gray-600 mt-2">Configura una nueva fuente de datos para tus agentes</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6 text-lente-600" />
              <CardTitle>Información del Datastore</CardTitle>
            </div>
            <CardDescription>
              Completa la información para crear tu nuevo datastore
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Datastore *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Base de Conocimientos de Productos"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Elige un nombre descriptivo para tu datastore
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
                  placeholder="Describe el contenido y propósito de este datastore..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-lente-500 focus:border-lente-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Opcional: Proporciona una descripción detallada del contenido
                </p>
              </div>

              <div className="bg-gray-50 border rounded p-3 text-sm text-gray-700">
                El Datastore se creará con tipo <strong>qdrant</strong> (requerido por Bravilo).
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Información Importante</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• El datastore se creará con la configuración básica</li>
                  <li>• Opcional: puedes subir una fuente de datos inmediatamente</li>
                  <li>• Los datos se procesarán automáticamente para ser utilizados por los agentes</li>
                  <li>• Podrás conectar este datastore a múltiples agentes</li>
                </ul>
              </div>

              {/* Immediate datasource section */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Subir fuente de datos ahora (opcional)</label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={uploadType === 'none' ? 'default' : 'outline'} onClick={() => setUploadType('none')}>Ninguna</Button>
                  <Button type="button" variant={uploadType === 'file' ? 'default' : 'outline'} onClick={() => setUploadType('file')}>
                    <Upload className="w-4 h-4 mr-2" /> Archivo
                  </Button>
                  <Button type="button" variant={uploadType === 'web_page' ? 'default' : 'outline'} onClick={() => setUploadType('web_page')}>
                    <LinkIcon className="w-4 h-4 mr-2" /> Página Web
                  </Button>
                  <Button type="button" variant={uploadType === 'web_site' ? 'default' : 'outline'} onClick={() => setUploadType('web_site')}>
                    <LinkIcon className="w-4 h-4 mr-2" /> Sitio Web
                  </Button>
                </div>

                {uploadType === 'file' && (
                  <div>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-lente-50 file:text-lente-700 hover:file:bg-lente-100"
                      accept=".pdf,.csv,.json,.txt,.md,.pptx,.docx,.xlsx"
                    />
                    <p className="text-xs text-gray-500 mt-1">Formatos soportados: pdf, csv, json, txt, md, pptx, docx, xlsx</p>
                  </div>
                )}

                {uploadType === 'web_page' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <Input value={urlName} onChange={(e) => setUrlName(e.target.value)} placeholder="Título de la página" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL de la página</label>
                      <Input value={urlValue} onChange={(e) => setUrlValue(e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                )}

                {uploadType === 'web_site' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <Input value={urlName} onChange={(e) => setUrlName(e.target.value)} placeholder="Nombre del sitio" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sitemap (opcional)</label>
                      <Input value={sitemapUrl} onChange={(e) => setSitemapUrl(e.target.value)} placeholder="https://.../sitemap.xml" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL de inicio (opcional)</label>
                      <Input value={urlValue} onChange={(e) => setUrlValue(e.target.value)} placeholder="https://..." />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Link href="/datastores">
                  <Button variant="outline" type="button">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={loading || !formData.name.trim() || (uploadType==='file' && !file)}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Crear Datastore{uploadType!=='none' ? ' + Fuente' : ''}
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
