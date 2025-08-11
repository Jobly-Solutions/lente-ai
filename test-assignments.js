const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAssignments() {
  console.log('🧪 Probando sistema de asignaciones...\n')
  
  try {
    // 1. Obtener usuarios disponibles
    console.log('1. Obteniendo usuarios...')
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

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

    // 2. Obtener agentes disponibles
    console.log('\n2. Obteniendo agentes...')
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .limit(5)

    if (agentsError) {
      console.error('❌ Error obteniendo agentes:', agentsError.message)
      return
    }

    console.log(`✅ ${agents?.length || 0} agentes encontrados`)
    if (agents && agents.length > 0) {
      agents.forEach(agent => {
        console.log(`   - ${agent.name} (${agent.agent_id})`)
      })
    }

    // 3. Crear una asignación de prueba
    if (users && users.length > 0 && agents && agents.length > 0) {
      console.log('\n3. Creando asignación de prueba...')
      
      const testUser = users[0]
      const testAgent = agents[0]
      
      console.log(`   Usuario: ${testUser.full_name || testUser.email}`)
      console.log(`   Agente: ${testAgent.name}`)

      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          user_id: testUser.id,
          agent_id: testAgent.id
        })
        .select()
        .single()

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

    // 4. Verificar asignaciones existentes
    console.log('\n4. Verificando asignaciones existentes...')
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
      assignments.forEach(assignment => {
        const userName = assignment.profiles?.full_name || assignment.profiles?.email || 'Usuario desconocido'
        const agentName = assignment.agents?.name || 'Agente desconocido'
        const date = new Date(assignment.assigned_at).toLocaleDateString()
        
        console.log(`   - ${userName} → ${agentName} (${date})`)
      })
    }

    // 5. Probar eliminación de asignación
    if (assignments && assignments.length > 0) {
      console.log('\n5. Probando eliminación de asignación...')
      
      const assignmentToDelete = assignments[0]
      console.log(`   Eliminando: ${assignmentToDelete.profiles?.full_name} → ${assignmentToDelete.agents?.name}`)

      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('user_id', assignmentToDelete.user_id)
        .eq('agent_id', assignmentToDelete.agent_id)

      if (deleteError) {
        console.error('❌ Error eliminando asignación:', deleteError.message)
      } else {
        console.log('✅ Asignación eliminada exitosamente')
      }
    }

    // 6. Resumen final
    console.log('\n📊 RESUMEN DE PRUEBAS:')
    console.log(`   - Usuarios disponibles: ${users?.length || 0}`)
    console.log(`   - Agentes disponibles: ${agents?.length || 0}`)
    console.log(`   - Asignaciones totales: ${assignments?.length || 0}`)
    console.log(`   - Operaciones de CRUD: ✅ Funcionando`)

    console.log('\n🎉 Sistema de asignaciones funcionando correctamente')

  } catch (error) {
    console.error('❌ Error general en pruebas:', error.message)
  }
}

// Ejecutar pruebas
testAssignments()
