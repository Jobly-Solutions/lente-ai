'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Users, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase, Profile } from '@/lib/supabase'
import { braviloApiClient, Agent as BraviloAgent } from '@/lib/bravilo-api'

export default function DebugAssignmentsPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    runDebug()
  }, [])

  async function runDebug() {
    setLoading(true)
    setError('')
    
    const debugData: any = {
      timestamp: new Date().toISOString(),
      steps: []
    }

    try {
      // Paso 1: Verificar configuración de API
      debugData.steps.push({
        step: 1,
        name: 'Verificar configuración de API',
        status: 'running'
      })

      const isApiConfigured = braviloApiClient.isApiConfigured()
      debugData.apiConfigured = isApiConfigured
      debugData.steps[0].status = 'success'
      debugData.steps[0].details = `API configurada: ${isApiConfigured}`

      // Paso 2: Obtener agentes
      debugData.steps.push({
        step: 2,
        name: 'Obtener agentes desde API',
        status: 'running'
      })

      try {
        const agents = await braviloApiClient.getAgents()
        debugData.agents = agents
        debugData.steps[1].status = 'success'
        debugData.steps[1].details = `${agents.length} agentes obtenidos`
        debugData.steps[1].data = agents
      } catch (agentError: any) {
        debugData.steps[1].status = 'error'
        debugData.steps[1].details = agentError.message
        debugData.agentError = agentError
      }

      // Paso 3: Obtener usuarios
      debugData.steps.push({
        step: 3,
        name: 'Obtener usuarios desde Supabase',
        status: 'running'
      })

      try {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name')

        if (usersError) {
          debugData.steps[2].status = 'error'
          debugData.steps[2].details = usersError.message
          debugData.usersError = usersError
        } else {
          debugData.users = users
          debugData.steps[2].status = 'success'
          debugData.steps[2].details = `${users?.length || 0} usuarios obtenidos`
          debugData.steps[2].data = users
        }
      } catch (userError: any) {
        debugData.steps[2].status = 'error'
        debugData.steps[2].details = userError.message
        debugData.userError = userError
      }

      // Paso 4: Obtener asignaciones
      debugData.steps.push({
        step: 4,
        name: 'Obtener asignaciones existentes',
        status: 'running'
      })

      try {
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            profiles!assignments_user_id_fkey(id, full_name, email),
            agents!assignments_agent_id_fkey(id, name, description)
          `)
          .order('assigned_at', { ascending: false })

        if (assignmentsError) {
          debugData.steps[3].status = 'error'
          debugData.steps[3].details = assignmentsError.message
          debugData.assignmentsError = assignmentsError
        } else {
          debugData.assignments = assignments
          debugData.steps[3].status = 'success'
          debugData.steps[3].details = `${assignments?.length || 0} asignaciones obtenidas`
          debugData.steps[3].data = assignments
        }
      } catch (assignmentError: any) {
        debugData.steps[3].status = 'error'
        debugData.steps[3].details = assignmentError.message
        debugData.assignmentError = assignmentError
      }

      // Paso 5: Verificar agentes locales
      debugData.steps.push({
        step: 5,
        name: 'Verificar agentes en base de datos local',
        status: 'running'
      })

      try {
        const { data: localAgents, error: localAgentsError } = await supabase
          .from('agents')
          .select('*')
          .order('name')

        if (localAgentsError) {
          debugData.steps[4].status = 'error'
          debugData.steps[4].details = localAgentsError.message
          debugData.localAgentsError = localAgentsError
        } else {
          debugData.localAgents = localAgents
          debugData.steps[4].status = 'success'
          debugData.steps[4].details = `${localAgents?.length || 0} agentes locales`
          debugData.steps[4].data = localAgents
        }
      } catch (localAgentError: any) {
        debugData.steps[4].status = 'error'
        debugData.steps[4].details = localAgentError.message
        debugData.localAgentError = localAgentError
      }

      setDebugInfo(debugData)

    } catch (error: any) {
      setError(error.message)
      debugData.error = error.message
      setDebugInfo(debugData)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Bot className="w-4 h-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-lente-600 rounded-lg flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lente-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ejecutando diagnóstico...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Debug de Asignaciones</h1>
          <p className="text-gray-600 mt-2">Diagnóstico del sistema de asignaciones</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-500">
            Última actualización: {debugInfo.timestamp}
          </div>
          <Button onClick={runDebug} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Ejecutar Diagnóstico
          </Button>
        </div>

        {/* Pasos de Debug */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pasos de Diagnóstico</CardTitle>
            <CardDescription>Estado de cada verificación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {debugInfo.steps?.map((step: any) => (
                <div key={step.step} className="flex items-center space-x-3 p-3 border rounded-lg">
                  {getStatusIcon(step.status)}
                  <div className="flex-1">
                    <div className="font-medium">{step.name}</div>
                    <div className="text-sm text-gray-600">{step.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Información Detallada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>Agentes de API</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.agents ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {debugInfo.agents.length} agentes disponibles
                  </div>
                  {debugInfo.agents.map((agent: any) => (
                    <div key={agent.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-gray-600">{agent.description}</div>
                      <div className="text-xs text-gray-500">ID: {agent.id}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No hay agentes disponibles</div>
              )}
            </CardContent>
          </Card>

          {/* Usuarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Usuarios</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.users ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {debugInfo.users.length} usuarios disponibles
                  </div>
                  {debugInfo.users.map((user: any) => (
                    <div key={user.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{user.full_name || 'Sin nombre'}</div>
                      <div className="text-gray-600">{user.email}</div>
                      <div className="text-xs text-gray-500">Rol: {user.role}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No hay usuarios disponibles</div>
              )}
            </CardContent>
          </Card>

          {/* Agentes Locales */}
          <Card>
            <CardHeader>
              <CardTitle>Agentes Locales</CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.localAgents ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {debugInfo.localAgents.length} agentes locales
                  </div>
                  {debugInfo.localAgents.map((agent: any) => (
                    <div key={agent.id} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-gray-600">{agent.description}</div>
                      <div className="text-xs text-gray-500">ID: {agent.agent_id}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No hay agentes locales</div>
              )}
            </CardContent>
          </Card>

          {/* Asignaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Asignaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.assignments ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    {debugInfo.assignments.length} asignaciones
                  </div>
                  {debugInfo.assignments.map((assignment: any) => (
                    <div key={`${assignment.user_id}-${assignment.agent_id}`} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">
                        {assignment.profiles?.full_name} → {assignment.agents?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No hay asignaciones</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Errores */}
        {(debugInfo.agentError || debugInfo.usersError || debugInfo.assignmentsError || debugInfo.localAgentsError) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-red-600">Errores Detectados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debugInfo.agentError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-800">Error en Agentes:</div>
                    <div className="text-red-700">{debugInfo.agentError.message}</div>
                  </div>
                )}
                {debugInfo.usersError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-800">Error en Usuarios:</div>
                    <div className="text-red-700">{debugInfo.usersError.message}</div>
                  </div>
                )}
                {debugInfo.assignmentsError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-800">Error en Asignaciones:</div>
                    <div className="text-red-700">{debugInfo.assignmentsError.message}</div>
                  </div>
                )}
                {debugInfo.localAgentsError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-800">Error en Agentes Locales:</div>
                    <div className="text-red-700">{debugInfo.localAgentsError.message}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
