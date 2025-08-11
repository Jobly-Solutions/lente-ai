// Test directo de la API de Bravilo
import { braviloApiClient } from './lib/bravilo-api.js'

async function testAgentsDirect() {
  try {
    console.log('🔄 Probando carga de agentes...')
    
    const agents = await braviloApiClient.getAgents()
    
    console.log(`✅ ${agents.length} agentes cargados:`)
    
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name}`)
      console.log(`   - ID: ${agent.id}`)
      console.log(`   - Descripción: ${agent.description || 'Sin descripción'}`)
      console.log(`   - Estado: ${agent.status}`)
      console.log(`   - Oculto: ${agent.hidden ? 'Sí' : 'No'}`)
      console.log(`   - Visibilidad: ${agent.visibility}`)
      console.log('')
    })
    
    const visibleAgents = agents.filter(agent => !agent.hidden && agent.status !== 'inactive')
    console.log(`🎯 ${visibleAgents.length} agentes visibles para asignaciones`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testAgentsDirect()
