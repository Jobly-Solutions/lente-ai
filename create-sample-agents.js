const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSampleAgents() {
  console.log('🤖 Creando agentes de muestra...\n')
  
  const sampleAgents = [
    {
      agent_id: 'support-agent',
      name: 'Agente de Soporte',
      description: 'Agente especializado en atención al cliente y soporte técnico',
      welcome_message: '¡Hola! Soy tu agente de soporte. ¿En qué puedo ayudarte hoy?',
      context: 'Soy un agente especializado en resolver problemas de clientes, responder consultas técnicas y proporcionar soporte de calidad.',
      is_active: true,
      is_shared: true
    },
    {
      agent_id: 'sales-agent',
      name: 'Agente de Ventas',
      description: 'Agente especializado en ventas y consultas comerciales',
      welcome_message: '¡Hola! Soy tu agente de ventas. ¿Te interesa conocer nuestros productos?',
      context: 'Soy un agente especializado en ventas, presentación de productos, cotizaciones y seguimiento de clientes potenciales.',
      is_active: true,
      is_shared: true
    },
    {
      agent_id: 'hr-agent',
      name: 'Agente de RRHH',
      description: 'Agente especializado en recursos humanos y gestión de personal',
      welcome_message: '¡Hola! Soy tu agente de RRHH. ¿Necesitas información sobre procesos de personal?',
      context: 'Soy un agente especializado en recursos humanos, gestión de personal, políticas de empresa y procesos internos.',
      is_active: true,
      is_shared: true
    },
    {
      agent_id: 'finance-agent',
      name: 'Agente Financiero',
      description: 'Agente especializado en finanzas y contabilidad',
      welcome_message: '¡Hola! Soy tu agente financiero. ¿Necesitas ayuda con temas contables?',
      context: 'Soy un agente especializado en finanzas, contabilidad, reportes financieros y análisis de datos económicos.',
      is_active: true,
      is_shared: true
    },
    {
      agent_id: 'marketing-agent',
      name: 'Agente de Marketing',
      description: 'Agente especializado en marketing digital y estrategias de comunicación',
      welcome_message: '¡Hola! Soy tu agente de marketing. ¿Quieres mejorar tu estrategia digital?',
      context: 'Soy un agente especializado en marketing digital, estrategias de comunicación, redes sociales y análisis de mercado.',
      is_active: true,
      is_shared: true
    }
  ]

  let createdCount = 0
  let existingCount = 0

  for (const agent of sampleAgents) {
    try {
      console.log(`🔄 Creando agente: ${agent.name}...`)
      
      const { data, error } = await supabase
        .from('agents')
        .insert(agent)
        .select()
        .single()

      if (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`ℹ️ Agente "${agent.name}" ya existe`)
          existingCount++
        } else {
          console.error(`❌ Error creando agente "${agent.name}":`, error.message)
        }
      } else {
        console.log(`✅ Agente "${agent.name}" creado exitosamente`)
        createdCount++
      }
    } catch (error) {
      console.error(`❌ Error inesperado con agente "${agent.name}":`, error.message)
    }
  }

  console.log('\n📊 RESUMEN DE CREACIÓN:')
  console.log(`   - Agentes creados: ${createdCount}`)
  console.log(`   - Agentes existentes: ${existingCount}`)
  console.log(`   - Total procesados: ${sampleAgents.length}`)

  // Verificar agentes finales
  console.log('\n🔍 Verificando agentes disponibles...')
  const { data: allAgents, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('❌ Error obteniendo agentes:', error.message)
  } else {
    console.log(`✅ Total de agentes activos: ${allAgents?.length || 0}`)
    if (allAgents && allAgents.length > 0) {
      console.log('   Agentes disponibles:')
      allAgents.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.agent_id})`)
      })
    }
  }

  console.log('\n🎉 Proceso completado')
}

// Ejecutar creación de agentes
createSampleAgents()
