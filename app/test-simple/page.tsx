'use client'

import { useState, useEffect } from 'react'

export default function TestSimplePage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Simular carga
    setTimeout(() => {
      setLoading(false)
      setMessage('¡Página funcionando correctamente!')
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Página de Prueba Simple</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Estado del Sistema</h2>
          <p className="text-green-600 mb-4">{message}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <h3 className="font-medium">React</h3>
              <p className="text-sm text-gray-600">✅ Funcionando</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <h3 className="font-medium">Next.js</h3>
              <p className="text-sm text-gray-600">✅ Funcionando</p>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <h3 className="font-medium">Tailwind CSS</h3>
              <p className="text-sm text-gray-600">✅ Funcionando</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Agentes de Prueba</h2>
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded">
              <strong>Agente de Soporte</strong> - Atención al cliente
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Agente de Ventas</strong> - Consultas comerciales
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Agente de RRHH</strong> - Gestión de personal
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Agente Financiero</strong> - Contabilidad y finanzas
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Agente de Marketing</strong> - Estrategias digitales
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Usuarios de Prueba</h2>
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded">
              <strong>JC Falcon</strong> - jc.falcon@lenteconsulting.com
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Admin Test</strong> - admin@test.com
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <strong>Test User</strong> - test@example.com
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">Diagnóstico</h2>
          <p className="text-yellow-700 mb-4">
            Si puedes ver esta página, el problema está en el sistema de autenticación o en las importaciones de componentes.
          </p>
          <div className="space-y-2 text-sm text-yellow-700">
            <div>• React y Next.js funcionan correctamente</div>
            <div>• Los estilos de Tailwind CSS se aplican</div>
            <div>• El problema está en AuthContext o ProtectedRoute</div>
            <div>• Necesitamos revisar las importaciones de componentes</div>
          </div>
        </div>
      </div>
    </div>
  )
}
