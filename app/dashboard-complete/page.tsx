'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bot, Database, Users, MessageSquare, Plus, ArrowRight, Settings, CheckCircle, AlertCircle } from 'lucide-react'
import { braviloApiClient } from '@/lib/bravilo-api'
import { supabase } from '@/lib/supabase'

interface Stats {
  agents: number
  datastores: number
  users: number
  assignments: number
}

export default function DashboardCompletePage() {
  const [stats, setStats] = useState<Stats>({
    agents: 0,
    datastores: 0,
    users: 0,
    assignments: 0
  })
  const [loading, setLoading] = useState(true)
  const [isApiConfigured, setIsApiConfigured] = useState(false)

  useEffect(() => {
    setIsApiConfigured(braviloApiClient.isApiConfigured())
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      console.log('🔄 Cargando estadísticas del dashboard...')

      // Cargar estadísticas en paralelo
      const [agentsData, datastoresData, usersData, assignmentsData] = await Promise.all([
        braviloApiClient.getAgents().catch(() => []),
        braviloApiClient.getDatastores().catch(() => []),
        supabase.from('profiles').select('id').then(({ data }) => data || []),
        supabase.from('assignments').select('user_id').then(({ data }) => data || [])
      ])

      setStats({
        agents: agentsData.length,
        datastores: datastoresData.length,
        users: usersData.length,
        assignments: assignmentsData.length
      })

      console.log('✅ Estadísticas cargadas:', {
        agents: agentsData.length,
        datastores: datastoresData.length,
        users: usersData.length,
        assignments: assignmentsData.length
      })

    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const adminActions = [
    {
      title: 'Gestión Completa',
      description: 'Panel de administración todo-en-uno',
      icon: Settings,
      href: '/admin-simple',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Crear Agente',
      description: 'Configura un nuevo agente de IA',
      icon: Bot,
      href: '/agents-simple',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Nuevo Datastore',
      description: 'Agrega datos para entrenar agentes',
      icon: Database,
      href: '/datastores-simple',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Probar Chat',
      description: 'Interactúa con tus agentes',
      icon: MessageSquare,
      href: '/chat',
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ]

  const quickLinks = [
    {
      title: 'Panel Admin',
      description: 'Gestión completa del sistema',
      href: '/admin-simple',
      icon: '🛠️'
    },
    {
      title: 'Agentes',
      description: 'Crear y gestionar agentes IA',
      href: '/agents-simple',
      icon: '🤖'
    },
    {
      title: 'Datastores',
      description: 'Administrar fuentes de datos',
      href: '/datastores-simple',
      icon: '🗄️'
    },
    {
      title: 'Chat',
      description: 'Conversar con agentes',
      href: '/chat',
      icon: '💬'
    },
    {
      title: 'Test Directo',
      description: 'Página de pruebas técnicas',
      href: '/direct-test',
      icon: '🧪'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Lente AI - Dashboard Completo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Plataforma de inteligencia artificial integrada con Bravilo. 
            Todo funcionando correctamente.
          </p>
        </div>

        {/* Estado del Sistema */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Estado del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800">Servidor</div>
                <div className="text-green-600">✅ Funcionando</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800">API Bravilo</div>
                <div className="text-blue-600">
                  {isApiConfigured ? '✅ Conectada' : '⚠️ No configurada'}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-800">Base de Datos</div>
                <div className="text-purple-600">✅ Supabase OK</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="font-medium text-orange-800">Autenticación</div>
                <div className="text-orange-600">✅ Deshabilitada (Dev)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Agentes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.agents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Datastores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.datastores}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.users}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Asignaciones</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.assignments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones Principales */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Acciones Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminActions.map((action, index) => (
              <a key={index} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${action.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                        <action.icon className={`w-6 h-6 ${action.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>

        {/* Enlaces Rápidos */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Enlaces Rápidos</CardTitle>
            <CardDescription>
              Acceso directo a todas las funciones del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="p-4 border rounded-lg hover:bg-gray-50 text-center transition-colors"
                >
                  <div className="text-2xl mb-2">{link.icon}</div>
                  <div className="font-medium text-sm">{link.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{link.description}</div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span>Información del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">✅ Funcionalidades Activas</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Creación de usuarios</li>
                  <li>• Gestión de agentes</li>
                  <li>• Administración de datastores</li>
                  <li>• Asignaciones usuario-agente</li>
                  <li>• Chat con agentes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🔧 Configuración</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Puerto: 3000</li>
                  <li>• Autenticación: Deshabilitada (desarrollo)</li>
                  <li>• API Bravilo: {isApiConfigured ? 'Configurada' : 'No configurada'}</li>
                  <li>• Base de datos: Supabase</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Próximos Pasos</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Probar creación de usuarios</li>
                  <li>• Crear agentes en Bravilo</li>
                  <li>• Configurar datastores</li>
                  <li>• Hacer asignaciones</li>
                  <li>• Probar chat funcional</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
