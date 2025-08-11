const axios = require('axios')

// Configuración de la API de Bravilo
const BRAVILO_BASE_URL = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api'
const BRAVILO_API_KEY = process.env.BRAVILO_API_KEY

async function testBraviloAPI() {
  console.log('🔍 Probando conexión con API de Bravilo...\n')
  
  if (!BRAVILO_API_KEY) {
    console.log('❌ BRAVILO_API_KEY no está configurada')
    console.log('💡 Para configurar la API:')
    console.log('   1. Ve a https://app.braviloai.com')
    console.log('   2. Obtén tu API key desde la configuración')
    console.log('   3. Crea un archivo .env.local con:')
    console.log('      BRAVILO_API_KEY=tu_api_key_aqui')
    console.log('   4. Reinicia el servidor')
    return
  }

  const braviloApi = axios.create({
    baseURL: BRAVILO_BASE_URL,
    headers: {
      'Authorization': `Bearer ${BRAVILO_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  try {
    // 1. Probar health check
    console.log('1. Probando health check...')
    try {
      const healthResponse = await braviloApi.get('/health')
      console.log(`✅ Health check: ${healthResponse.data.status}`)
    } catch (error) {
      console.log('⚠️ Health check no disponible, continuando...')
    }

    // 2. Obtener agentes
    console.log('\n2. Obteniendo agentes...')
    const agentsResponse = await braviloApi.get('/agents')
    const agents = agentsResponse.data

    console.log(`✅ ${agents.length} agentes encontrados`)
    
    if (agents.length > 0) {
      console.log('   Agentes disponibles:')
      agents.forEach((agent, index) => {
        const status = agent.status === 'active' ? '🟢' : '🔴'
        console.log(`   ${index + 1}. ${status} ${agent.name}`)
        if (agent.description) {
          console.log(`      Descripción: ${agent.description}`)
        }
        console.log(`      ID: ${agent.id}`)
        console.log(`      Estado: ${agent.status}`)
        console.log(`      Creado: ${new Date(agent.createdAt).toLocaleDateString()}`)
        console.log('')
      })
    } else {
      console.log('   No hay agentes disponibles')
    }

    // 3. Probar obtención de un agente específico
    if (agents.length > 0) {
      console.log('3. Probando obtención de agente específico...')
      const firstAgent = agents[0]
      
      try {
        const agentResponse = await braviloApi.get(`/agents/${firstAgent.id}`)
        console.log(`✅ Agente obtenido: ${agentResponse.data.name}`)
      } catch (error) {
        console.log('❌ Error obteniendo agente específico:', error.response?.data?.error || error.message)
      }
    }

    // 4. Resumen
    console.log('\n📊 RESUMEN:')
    console.log(`   - API URL: ${BRAVILO_BASE_URL}`)
    console.log(`   - API Key: ${BRAVILO_API_KEY ? '✅ Configurada' : '❌ No configurada'}`)
    console.log(`   - Agentes totales: ${agents.length}`)
    console.log(`   - Agentes activos: ${agents.filter(a => a.status === 'active').length}`)
    console.log(`   - Agentes inactivos: ${agents.filter(a => a.status === 'inactive').length}`)

    if (agents.length > 0) {
      console.log('\n🎉 API de Bravilo funcionando correctamente')
      console.log('💡 Los agentes están listos para ser asignados')
    } else {
      console.log('\n⚠️ No hay agentes disponibles en la API')
      console.log('💡 Crea algunos agentes en Bravilo antes de continuar')
    }

  } catch (error) {
    console.error('❌ Error conectando con API de Bravilo:', error.message)
    
    if (error.response) {
      console.error('   Status:', error.response.status)
      console.error('   Data:', error.response.data)
      
      if (error.response.status === 401) {
        console.log('\n💡 Error de autenticación. Verifica tu API key.')
      } else if (error.response.status === 403) {
        console.log('\n💡 Error de permisos. Verifica que tu API key tenga permisos para leer agentes.')
      } else if (error.response.status === 404) {
        console.log('\n💡 Endpoint no encontrado. Verifica la URL de la API.')
      }
    }
  }
}

// Ejecutar prueba
testBraviloAPI()
