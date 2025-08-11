'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database, Search, Trash2 } from 'lucide-react'
import { braviloApiClient, DatastoreQueryResult, Datasource } from '@/lib/bravilo-api'

export default function DatastoresToolsPage() {
  // Datastore Query
  const [datastoreId, setDatastoreId] = useState('')
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState<number | ''>('')
  const [customIds, setCustomIds] = useState('')
  const [datasourceIds, setDatasourceIds] = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [results, setResults] = useState<DatastoreQueryResult[]>([])
  const [queryError, setQueryError] = useState('')

  // Datasource Admin
  const [datasourceId, setDatasourceId] = useState('')
  const [datasource, setDatasource] = useState<Datasource | null>(null)
  const [dsLoading, setDsLoading] = useState(false)
  const [dsMessage, setDsMessage] = useState('')
  // Upload
  const [uploadDatastoreId, setUploadDatastoreId] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCustomId, setUploadCustomId] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)

  async function runQuery() {
    setQueryError('')
    setResults([])
    if (!datastoreId || !query) {
      setQueryError('Completa Datastore ID y Query')
      return
    }
    try {
      setQueryLoading(true)
      const filters: any = {}
      if (customIds.trim()) filters.custom_ids = customIds.split(',').map((s) => s.trim()).filter(Boolean)
      if (datasourceIds.trim()) filters.datasource_ids = datasourceIds.split(',').map((s) => s.trim()).filter(Boolean)

      const res = await braviloApiClient.queryDatastore(datastoreId, {
        query,
        topK: typeof topK === 'number' ? topK : undefined,
        filters: Object.keys(filters).length ? filters : undefined,
      })
      setResults(res || [])
    } catch (e: any) {
      setQueryError(e?.message || 'Error consultando datastore')
    } finally {
      setQueryLoading(false)
    }
  }

  async function fetchDatasource() {
    setDsMessage('')
    setDatasource(null)
    if (!datasourceId) return
    try {
      setDsLoading(true)
      const ds = await braviloApiClient.getDatasource(datasourceId)
      if (!ds) setDsMessage('No encontrado o sin permisos')
      setDatasource(ds)
    } catch (e: any) {
      setDsMessage(e?.message || 'Error obteniendo datasource')
    } finally {
      setDsLoading(false)
    }
  }

  async function deleteDatasource() {
    setDsMessage('')
    if (!datasourceId) return
    if (!confirm('¿Eliminar esta fuente de datos? Esta acción no se puede deshacer.')) return
    try {
      setDsLoading(true)
      const ok = await braviloApiClient.deleteDatasource(datasourceId)
      setDsMessage(ok ? 'Datasource eliminado' : 'No se pudo eliminar')
      if (ok) setDatasource(null)
    } catch (e: any) {
      setDsMessage(e?.message || 'Error eliminando datasource')
    } finally {
      setDsLoading(false)
    }
  }

  async function uploadFileDatasource() {
    setDsMessage('')
    if (!uploadDatastoreId || !uploadFile) {
      setDsMessage('Completa Datastore ID y archivo')
      return
    }
    try {
      setUploadLoading(true)
      const form = new FormData()
      form.append('file', uploadFile)
      form.append('fileName', uploadFile.name)
      form.append('type', 'file')
      form.append('datastoreId', uploadDatastoreId)
      if (uploadCustomId.trim()) form.append('custom_id', uploadCustomId.trim())
      const res = await fetch('/api/datasources', {
        method: 'POST',
        body: form,
      })
      const text = await res.text()
      setDsMessage(res.ok ? 'Archivo subido correctamente' : `Error: ${text}`)
    } catch (e: any) {
      setDsMessage(e?.message || 'Error subiendo archivo')
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Datastore Query */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Consultar Datastore</span>
              </CardTitle>
              <CardDescription>
                Consulta fragmentos similares por texto y filtros opcionales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input placeholder="Datastore ID" value={datastoreId} onChange={(e) => setDatastoreId(e.target.value)} />
                <Input placeholder="Query" value={query} onChange={(e) => setQuery(e.target.value)} />
                <Input placeholder="topK (opcional)" type="number" value={topK} onChange={(e) => setTopK(e.target.value ? Number(e.target.value) : '')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input placeholder="filters.custom_ids (comma-separated)" value={customIds} onChange={(e) => setCustomIds(e.target.value)} />
                <Input placeholder="filters.datasource_ids (comma-separated)" value={datasourceIds} onChange={(e) => setDatasourceIds(e.target.value)} />
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <Button onClick={runQuery} disabled={queryLoading}>
                  <Search className={`w-4 h-4 mr-2 ${queryLoading ? 'animate-spin' : ''}`} />
                  Consultar
                </Button>
                {queryError && <span className="text-red-600 text-sm">{queryError}</span>}
              </div>
              {results.length > 0 && (
                <div className="space-y-3">
                  {results.map((r, idx) => (
                    <div key={idx} className="p-3 border rounded">
                      <div className="text-sm text-gray-500 mb-1">score: {r.score?.toFixed?.(4) ?? r.score}</div>
                      <div className="text-gray-900 whitespace-pre-wrap">{r.text}</div>
                      <div className="mt-1 text-xs text-gray-500">{r.source} {r.datasource_name && `• ${r.datasource_name}`}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datasource Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Fuente de Datos (Datasource)</span>
              </CardTitle>
              <CardDescription>
                Obtener o eliminar una fuente de datos por ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input placeholder="Datasource ID" value={datasourceId} onChange={(e) => setDatasourceId(e.target.value)} />
                <Button onClick={fetchDatasource} disabled={dsLoading}>
                  <Search className={`w-4 h-4 mr-2 ${dsLoading ? 'animate-spin' : ''}`} />
                  Obtener
                </Button>
                <Button variant="destructive" onClick={deleteDatasource} disabled={dsLoading || !datasourceId}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
              {dsMessage && <div className="text-sm text-gray-600 mb-2">{dsMessage}</div>}
              {datasource && (
                <div className="text-sm text-gray-800 space-y-1">
                  <div><strong>ID:</strong> {datasource.id}</div>
                  <div><strong>Nombre:</strong> {datasource.name}</div>
                  <div><strong>Tipo:</strong> {datasource.type}</div>
                  <div><strong>Estado:</strong> {datasource.status}</div>
                  <div><strong>Actualizado:</strong> {datasource.updatedAt}</div>
                </div>
              )}

              <hr className="my-6" />
              <CardTitle className="text-base mb-2">Subir archivo a Datastore</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <Input placeholder="Datastore ID" value={uploadDatastoreId} onChange={(e) => setUploadDatastoreId(e.target.value)} />
                <Input placeholder="custom_id (opcional)" value={uploadCustomId} onChange={(e) => setUploadCustomId(e.target.value)} />
                <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
              </div>
              <Button onClick={uploadFileDatasource} disabled={uploadLoading || !uploadDatastoreId || !uploadFile}>
                {uploadLoading ? 'Subiendo...' : 'Subir Archivo'}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}


