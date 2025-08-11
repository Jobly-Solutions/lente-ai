const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabase() {
  console.log('🔍 Verificando estructura de la base de datos...\n')
  
  try {
    // 1. Verificar tabla profiles
    console.log('1. Verificando tabla profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Error con tabla profiles:', profilesError.message)
    } else {
      console.log('✅ Tabla profiles existe')
    }

    // 2. Verificar tabla agents
    console.log('\n2. Verificando tabla agents...')
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(5)
    
    if (agentsError) {
      console.error('❌ Error con tabla agents:', agentsError.message)
      console.log('💡 La tabla agents no existe o tiene problemas')
    } else {
      console.log(`✅ Tabla agents existe con ${agents?.length || 0} agentes`)
      if (agents && agents.length > 0) {
        console.log('   Agentes encontrados:')
        agents.forEach(agent => {
          console.log(`   - ${agent.name} (${agent.agent_id})`)
        })
      }
    }

    // 3. Verificar tabla assignments
    console.log('\n3. Verificando tabla assignments...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(5)
    
    if (assignmentsError) {
      console.error('❌ Error con tabla assignments:', assignmentsError.message)
      console.log('💡 La tabla assignments no existe o tiene problemas')
    } else {
      console.log(`✅ Tabla assignments existe con ${assignments?.length || 0} asignaciones`)
    }

    // 4. Crear agentes de prueba si no existen
    console.log('\n4. Verificando si necesitamos crear agentes de prueba...')
    const { data: existingAgents, error: countError } = await supabase
      .from('agents')
      .select('count')
      .limit(1)
    
    if (countError) {
      console.log('❌ No se pudo verificar el conteo de agentes')
    } else {
      console.log('✅ Verificación de conteo completada')
    }

    // 5. Intentar crear un agente de prueba
    console.log('\n5. Creando agente de prueba...')
    const testAgent = {
      agent_id: 'test-agent-001',
      name: 'Agente de Prueba',
      description: 'Agente para pruebas del sistema',
      welcome_message: '¡Hola! Soy un agente de prueba.',
      context: 'Soy un agente creado para probar el sistema de asignaciones.',
      is_active: true,
      is_shared: false
    }

    const { data: newAgent, error: createError } = await supabase
      .from('agents')
      .insert(testAgent)
      .select()
      .single()

    if (createError) {
      if (createError.message.includes('duplicate key')) {
        console.log('ℹ️ Agente de prueba ya existe')
      } else {
        console.error('❌ Error creando agente de prueba:', createError.message)
      }
    } else {
      console.log('✅ Agente de prueba creado exitosamente')
    }

    // 6. Verificar relaciones
    console.log('\n6. Verificando relaciones entre tablas...')
    
    // Intentar hacer un join
    const { data: testJoin, error: joinError } = await supabase
      .from('assignments')
      .select(`
        *,
        profiles!assignments_user_id_fkey(id, full_name, email),
        agents!assignments_agent_id_fkey(id, name, description)
      `)
      .limit(1)

    if (joinError) {
      console.error('❌ Error con joins:', joinError.message)
      console.log('💡 Las relaciones entre tablas pueden tener problemas')
    } else {
      console.log('✅ Relaciones entre tablas funcionando correctamente')
    }

    // 7. Resumen final
    console.log('\n📊 RESUMEN DE VERIFICACIÓN:')
    console.log('   - Tabla profiles: ✅')
    console.log('   - Tabla agents: ' + (agentsError ? '❌' : '✅'))
    console.log('   - Tabla assignments: ' + (assignmentsError ? '❌' : '✅'))
    console.log('   - Relaciones: ' + (joinError ? '❌' : '✅'))
    
    if (agentsError || assignmentsError || joinError) {
      console.log('\n🚨 PROBLEMAS DETECTADOS:')
      console.log('   Es posible que necesites ejecutar el script de setup de la base de datos.')
      console.log('   Archivo: supabase-setup.sql')
    } else {
      console.log('\n🎉 Base de datos verificada correctamente')
    }

  } catch (error) {
    console.error('❌ Error general en verificación:', error.message)
  }
}

// Ejecutar verificación
checkDatabase()
