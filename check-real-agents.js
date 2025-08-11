const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAgents() {
  console.log('🔍 Verificando agentes en el sistema...\n');

  try {
    // 1. Verificar agentes en la tabla local
    console.log('📊 1. Agentes en tabla local (agents):');
    const { data: localAgents, error: localError } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (localError) {
      console.error('❌ Error consultando agentes locales:', localError);
    } else {
      console.log(`✅ ${localAgents?.length || 0} agentes encontrados en tabla local`);
      if (localAgents && localAgents.length > 0) {
        localAgents.forEach((agent, index) => {
          console.log(`   ${index + 1}. ${agent.name || 'Sin nombre'} (ID: ${agent.id})`);
          console.log(`      - Descripción: ${agent.description || 'Sin descripción'}`);
          console.log(`      - Agent ID: ${agent.agent_id || 'N/A'}`);
          console.log(`      - Activo: ${agent.is_active ? 'Sí' : 'No'}`);
          console.log(`      - Compartido: ${agent.is_shared ? 'Sí' : 'No'}`);
          console.log(`      - Creado: ${new Date(agent.created_at).toLocaleString()}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️ No hay agentes en la tabla local');
      }
    }

    // 2. Verificar asignaciones existentes
    console.log('📊 2. Asignaciones existentes:');
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        profiles!assignments_user_id_fkey(id, full_name, email),
        agents!assignments_agent_id_fkey(id, name, description)
      `)
      .order('assigned_at', { ascending: false });

    if (assignmentsError) {
      console.error('❌ Error consultando asignaciones:', assignmentsError);
    } else {
      console.log(`✅ ${assignments?.length || 0} asignaciones encontradas`);
      if (assignments && assignments.length > 0) {
        assignments.forEach((assignment, index) => {
          console.log(`   ${index + 1}. Usuario: ${assignment.profiles?.full_name || 'Sin nombre'} (${assignment.profiles?.email})`);
          console.log(`      - Agente: ${assignment.agents?.name || 'Sin nombre'} (ID: ${assignment.agents?.id})`);
          console.log(`      - Asignado: ${new Date(assignment.assigned_at).toLocaleString()}`);
          console.log('');
        });
      } else {
        console.log('   ⚠️ No hay asignaciones creadas');
      }
    }

    // 3. Verificar usuarios disponibles
    console.log('📊 3. Usuarios disponibles:');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (usersError) {
      console.error('❌ Error consultando usuarios:', usersError);
    } else {
      console.log(`✅ ${users?.length || 0} usuarios encontrados`);
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.full_name || 'Sin nombre'} (${user.email})`);
        });
      } else {
        console.log('   ⚠️ No hay usuarios registrados');
      }
    }

    // 4. Verificar configuración de API
    console.log('\n📊 4. Configuración de API:');
    console.log(`   BRAVILO_BASE_URL: ${process.env.BRAVILO_BASE_URL || 'No configurado'}`);
    console.log(`   BRAVILO_API_KEY: ${process.env.BRAVILO_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);

    // 5. Intentar obtener agentes de la API
    console.log('\n📊 5. Probando API de Bravilo:');
    if (process.env.BRAVILO_API_KEY) {
      try {
        const axios = require('axios');
        const apiUrl = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api';
        
        console.log(`   🔄 Intentando conectar a: ${apiUrl}`);
        
        const response = await axios.get(`${apiUrl}/agents`, {
          headers: {
            'Authorization': `Bearer ${process.env.BRAVILO_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000
        });

        console.log(`   ✅ API conectada exitosamente`);
        console.log(`   📊 ${response.data?.length || 0} agentes en la API`);
        
        if (response.data && response.data.length > 0) {
          response.data.forEach((agent, index) => {
            console.log(`   ${index + 1}. ${agent.name} (ID: ${agent.id})`);
            console.log(`      - Descripción: ${agent.description || 'Sin descripción'}`);
            console.log(`      - Estado: ${agent.status}`);
            console.log(`      - Creado: ${new Date(agent.createdAt).toLocaleString()}`);
            console.log('');
          });
        }
      } catch (apiError) {
        console.log(`   ❌ Error conectando a la API: ${apiError.message}`);
        if (apiError.response) {
          console.log(`   📊 Status: ${apiError.response.status}`);
          console.log(`   📊 Response: ${JSON.stringify(apiError.response.data, null, 2)}`);
        }
      }
    } else {
      console.log('   ⚠️ No se puede probar la API sin BRAVILO_API_KEY');
    }

    // 6. Resumen y recomendaciones
    console.log('\n📋 RESUMEN Y RECOMENDACIONES:');
    console.log('='.repeat(50));
    
    if (localAgents && localAgents.length > 0) {
      console.log('✅ Tienes agentes en la base de datos local');
      console.log('✅ Puedes usar estos agentes para asignaciones');
      console.log('');
      console.log('🎯 Para la página de asignaciones:');
      console.log('   - Usa los agentes de la tabla local (agents)');
      console.log('   - No necesitas la API de Bravilo si ya tienes agentes');
      console.log('   - Los agentes locales son:');
      localAgents.forEach(agent => {
        console.log(`     • ${agent.name} (ID: ${agent.id})`);
      });
    } else {
      console.log('⚠️ No tienes agentes en la base de datos local');
      console.log('');
      if (process.env.BRAVILO_API_KEY) {
        console.log('🎯 Opciones:');
        console.log('   1. Configurar la API de Bravilo para obtener agentes');
        console.log('   2. Crear agentes manualmente en la tabla local');
      } else {
        console.log('🎯 Necesitas:');
        console.log('   1. Configurar BRAVILO_API_KEY en .env.local');
        console.log('   2. O crear agentes manualmente en la tabla local');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkAgents().then(() => {
  console.log('\n✅ Verificación completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en la verificación:', error);
  process.exit(1);
});
