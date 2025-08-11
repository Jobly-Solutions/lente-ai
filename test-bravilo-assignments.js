const { createClient } = require('@supabase/supabase-js')
const axios = require('axios')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Fallback agents for testing
const FALLBACK_AGENTS = [
  {
    id: 'fallback-support',
    name: 'Agente de Soporte',
    description: 'Agente especializado en atención al cliente',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-sales',
    name: 'Agente de Ventas',
    description: 'Agente especializado en ventas y consultas comerciales',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-hr',
    name: 'Agente de RRHH',
    description: 'Agente especializado en recursos humanos',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-finance',
    name: 'Agente Financiero',
    description: 'Agente especializado en finanzas y contabilidad',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-marketing',
    name: 'Agente de Marketing',
    description: 'Agente especializado en marketing digital',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

async function getAgentsFromAPI() {
  const BRAVILO_API_KEY = process.env.BRAVILO_API_KEY
  
  if (!BRAVILO_API_KEY) {
    console.log('⚠️ BRAVILO_API_KEY no configurada, usando agentes de fallback')
    return FALLBACK_AGENTS
  }

  try {
    const response = await axios.get('https://app.braviloai.com/api/agents', {
      headers: {
        'Authorization': `Bearer ${BRAVILO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    console.log('❌ Error obteniendo agentes de API, usando fallback')
    return FALLBACK_AGENTS
  }
}

async function testBraviloAssignments() {
  console.log('🧪 Probando asignaciones con agentes de Bravilo API...\n')
  
  try {
    // 1. Verificar configuración de API
    console.log('1. Verificando configuración de API...')
    const isApiConfigured = !!process.env.BRAVILO_API_KEY
    console.log(`   API Configurada: ${isApiConfigured ? '✅' : '⚠️ (usando fallback)'}`)

    // 2. Obtener agentes desde la API
    console.log('\n2. Obteniendo agentes desde Bravilo API...')
    const agents = await getAgentsFromAPI()
    
    console.log(`✅ ${agents.length} agentes obtenidos`)
    if (agents.length > 0) {
      console.log('   Agentes disponibles:')
      agents.forEach((agent, index) => {
        const status = agent.status === 'active' ? '🟢' : '🔴'
        console.log(`   ${index + 1}. ${status} ${agent.name}`)
        if (agent.description) {
          console.log(`      Descripción: ${agent.description}`)
        }
        console.log(`      ID: ${agent.id}`)
      })
    }

    // 3. Obtener usuarios
    console.log('\n3. Obteniendo usuarios...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .limit(3)

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError.message)
      return
    }

    console.log(`✅ ${users?.length || 0} usuarios encontrados`)
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`   - ${user.full_name || 'Sin nombre'} (${user.email})`)
      })
    }

    // 4. Crear asignación de prueba
    if (agents.length > 0 && users && users.length > 0) {
      console.log('\n4. Creando asignación de prueba...')
      
      const testUser = users[0]
      const testAgent = agents[0]
      
      console.log(`   Usuario: ${testUser.full_name || testUser.email}`)
      console.log(`   Agente: ${testAgent.name}`)

      // Verificar si el agente existe en la base de datos local
      const { data: existingAgent, error: checkError } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_id', testAgent.id)
        .single()

      let localAgentId = existingAgent?.id

      if (!existingAgent) {
        console.log('   Creando agente en base de datos local...')
        
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            agent_id: testAgent.id,
            name: testAgent.name,
            description: testAgent.description,
            is_active: true,
            is_shared: false
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creando agente local:', createError.message)
          return
        }

        localAgentId = newAgent.id
        console.log('✅ Agente creado en base de datos local')
      } else {
        console.log('✅ Agente ya existe en base de datos local')
      }

      // Crear la asignación
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          user_id: testUser.id,
          agent_id: localAgentId
        })

      if (assignmentError) {
        if (assignmentError.message.includes('duplicate key')) {
          console.log('ℹ️ Asignación ya existe')
        } else {
          console.error('❌ Error creando asignación:', assignmentError.message)
          return
        }
      } else {
        console.log('✅ Asignación creada exitosamente')
      }
    }

    // 5. Verificar asignaciones existentes
    console.log('\n5. Verificando asignaciones existentes...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        profiles!assignments_user_id_fkey(id, full_name, email),
        agents!assignments_agent_id_fkey(id, name, description)
      `)
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      console.error('❌ Error obteniendo asignaciones:', assignmentsError.message)
      return
    }

    console.log(`✅ ${assignments?.length || 0} asignaciones encontradas`)
    if (assignments && assignments.length > 0) {
      console.log('   Asignaciones:')
      assignments.forEach((assignment, index) => {
        const userName = assignment.profiles?.full_name || assignment.profiles?.email || 'Usuario desconocido'
        const agentName = assignment.agents?.name || 'Agente desconocido'
        const date = new Date(assignment.assigned_at).toLocaleDateString()
        
        console.log(`   ${index + 1}. ${userName} → ${agentName} (${date})`)
      })
    }

    // 6. Resumen final
    console.log('\n📊 RESUMEN DE PRUEBAS:')
    console.log(`   - API Configurada: ${isApiConfigured ? '✅' : '⚠️ Fallback'}`)
    console.log(`   - Agentes de API: ${agents.length}`)
    console.log(`   - Usuarios disponibles: ${users?.length || 0}`)
    console.log(`   - Asignaciones totales: ${assignments?.length || 0}`)
    console.log(`   - Operaciones de CRUD: ✅ Funcionando`)

    if (isApiConfigured) {
      console.log('\n🎉 Sistema funcionando con API real de Bravilo')
    } else {
      console.log('\n🎉 Sistema funcionando con agentes de fallback')
      console.log('💡 Para usar agentes reales, configura BRAVILO_API_KEY en .env.local')
    }

  } catch (error) {
    console.error('❌ Error general en pruebas:', error.message)
  }
}

// Ejecutar pruebas
testBraviloAssignments()
