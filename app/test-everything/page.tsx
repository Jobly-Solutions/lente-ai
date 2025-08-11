'use client'

import { useState, useEffect } from 'react'
import { braviloApiClient } from '@/lib/bravilo-api'
import { supabase } from '@/lib/supabase'

export default function TestEverythingPage() {
  const [status, setStatus] = useState('🔄 Iniciando pruebas...')
  const [results, setResults] = useState<string[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    runTests()
  }, [])

  async function runTests() {
    const newResults: string[] = []
    
    try {
      // Test 1: API Configuration
      setStatus('🔄 Probando configuración de API...')
      const isConfigured = braviloApiClient.isApiConfigured()
      newResults.push(`🔧 API Configurada: ${isConfigured ? '✅ SÍ' : '❌ NO'}`)
      setResults([...newResults])

      // Test 2: Load Agents
      setStatus('🔄 Cargando agentes...')
      try {
        const agentsData = await braviloApiClient.getAgents()
        const visibleAgents = agentsData.filter(a => !a.hidden)
        setAgents(visibleAgents)
        newResults.push(`🤖 Agentes: ${visibleAgents.length} disponibles`)
        visibleAgents.forEach(agent => {
          newResults.push(`   - ${agent.name} (${agent.id})`)
        })
      } catch (error: any) {
        newResults.push(`❌ Error agentes: ${error.message}`)
      }
      setResults([...newResults])

      // Test 3: Load Users
      setStatus('🔄 Cargando usuarios...')
      try {
        const { data: usersData, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setUsers(usersData || [])
        newResults.push(`👥 Usuarios: ${usersData?.length || 0} registrados`)
        usersData?.slice(0, 5).forEach(user => {
          newResults.push(`   - ${user.full_name || 'Sin nombre'} (${user.email})`)
        })
      } catch (error: any) {
        newResults.push(`❌ Error usuarios: ${error.message}`)
      }
      setResults([...newResults])

      // Test 4: Test Assignment Capability
      setStatus('🔄 Probando capacidad de asignación...')
      if (agents.length > 0 && users.length > 0) {
        newResults.push(`✅ Listo para asignaciones: ${agents.length} agentes x ${users.length} usuarios`)
      } else {
        newResults.push(`⚠️ No se pueden hacer asignaciones: faltan agentes (${agents.length}) o usuarios (${users.length})`)
      }
      setResults([...newResults])

      setStatus('✅ Todas las pruebas completadas')

    } catch (error: any) {
      newResults.push(`❌ Error general: ${error.message}`)
      setResults([...newResults])
      setStatus('❌ Pruebas fallaron')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Prueba Completa del Sistema
          </h1>
          
          <div className="mb-6">
            <div className="text-xl font-semibold mb-2">Estado:</div>
            <div className="text-lg">{status}</div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Resultados:</h2>
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
              {results.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>

          {agents.length > 0 && users.length > 0 && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                🎉 ¡Sistema Listo!
              </h3>
              <div className="text-green-700">
                <p>✅ {agents.length} agentes disponibles para asignar</p>
                <p>✅ {users.length} usuarios registrados</p>
                <p>✅ API de Bravilo funcionando</p>
                <p>✅ Base de datos conectada</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="/admin-simple"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              🛠️ Panel de Admin
            </a>
            <a
              href="/dashboard-complete"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🏠 Dashboard
            </a>
            <a
              href="/agents-simple"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              🤖 Agentes
            </a>
            <button
              onClick={runTests}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              🔄 Ejecutar Pruebas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
