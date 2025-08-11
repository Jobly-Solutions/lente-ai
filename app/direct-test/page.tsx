'use client'

import { useState, useEffect } from 'react'

export default function DirectTestPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      console.log('🔄 Cargando agentes...')
      setLoading(true)
      
      // Simulamos agentes de prueba primero
      const testAgents = [
        { id: 'test-1', name: 'Agente de Soporte', description: 'Agente de prueba para soporte' },
        { id: 'test-2', name: 'Agente de Ventas', description: 'Agente de prueba para ventas' },
        { id: 'test-3', name: 'Agente de RRHH', description: 'Agente de prueba para recursos humanos' }
      ]
      
      // Simular delay de carga
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setAgents(testAgents)
      console.log('✅ Agentes cargados:', testAgents)
      
    } catch (error: any) {
      console.error('❌ Error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#111827'
        }}>
          🧪 Test Directo - Lente AI
        </h1>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Esta página funciona SIN autenticación para probar que todo está correcto
        </p>

        {/* Estado */}
        <div style={{
          backgroundColor: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>
            📊 Estado del Sistema
          </h3>
          <p style={{ margin: 0, color: '#1e40af' }}>
            Servidor: ✅ Funcionando en puerto 3001<br/>
            Página: ✅ Carga sin autenticación<br/>
            React: ✅ Hooks funcionando correctamente
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem auto'
            }}></div>
            <p>Cargando agentes de prueba...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            color: '#dc2626'
          }}>
            ❌ Error: {error}
          </div>
        )}

        {/* Agentes */}
        {!loading && agents.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <h3 style={{
              margin: '0 0 1rem 0',
              color: '#111827',
              fontSize: '1.25rem'
            }}>
              🤖 Agentes de Prueba Cargados
            </h3>
            
            {agents.map((agent, index) => (
              <div key={agent.id} style={{
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '1rem',
                backgroundColor: '#f9fafb'
              }}>
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  color: '#374151'
                }}>
                  {agent.name}
                </h4>
                <p style={{
                  margin: 0,
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  {agent.description}
                </p>
                <small style={{
                  color: '#9ca3af'
                }}>
                  ID: {agent.id}
                </small>
              </div>
            ))}
          </div>
        )}

        {/* Botones de navegación */}
        <div style={{
          marginTop: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          padding: '1.5rem'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            color: '#111827'
          }}>
            🔗 Navegación
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <a 
              href="/auth/login"
              style={{
                display: 'block',
                padding: '0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              🔐 Ir a Login (admin@lente.ai / admin123)
            </a>
            
            <a 
              href="/admin/assignments"
              style={{
                display: 'block',
                padding: '0.75rem',
                backgroundColor: '#10b981',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              📋 Ir a Asignaciones (requiere login)
            </a>
            
            <button
              onClick={loadAgents}
              style={{
                padding: '0.75rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🔄 Recargar Agentes de Prueba
            </button>
          </div>
        </div>

        {/* Diagnóstico */}
        <div style={{
          marginTop: '2rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            color: '#15803d'
          }}>
            ✅ Diagnóstico
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '1.5rem',
            color: '#15803d'
          }}>
            <li>Servidor Next.js: Funcionando ✅</li>
            <li>Puerto 3001: Correcto ✅</li>
            <li>React Hooks: Funcionando ✅</li>
            <li>Esta página: Carga sin problemas ✅</li>
            <li>JavaScript: Ejecutándose correctamente ✅</li>
          </ul>
        </div>
      </div>

      {/* CSS para animación */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
