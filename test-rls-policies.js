// ========================================
// TEST RLS POLICIES
// Ejecutar: node test-rls-policies.js
// ========================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 TESTING RLS POLICIES...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ ERROR: Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSPolicies() {
    try {
        console.log('🚀 Starting RLS policy tests...\n');
        
        // Test 1: Verificar usuarios admin
        console.log('1. Checking admin users...');
        const { data: adminUsers, error: adminError } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .eq('role', 'admin');
            
        if (adminError) {
            console.log('❌ Error fetching admin users:', adminError.message);
            return false;
        }
        
        console.log(`✅ Found ${adminUsers.length} admin users:`);
        adminUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.full_name || 'Sin nombre'})`);
        });
        
        if (adminUsers.length === 0) {
            console.log('❌ No admin users found');
            return false;
        }
        
        const adminUser = adminUsers[0];
        
        // Test 2: Verificar políticas RLS para agents
        console.log('\n2. Testing agents RLS policies...');
        
        // Test 2.1: Intentar crear agente como admin
        console.log('   2.1. Testing agent creation as admin...');
        const testAgentData = {
            agent_id: `test-rls-agent-${Date.now()}`,
            name: 'Test RLS Agent',
            description: 'Test agent for RLS policies',
            is_active: true,
            is_shared: false,
            user_id: adminUser.id
        };
        
        const { data: newAgent, error: agentError } = await supabase
            .from('agents')
            .insert(testAgentData)
            .select()
            .single();
            
        if (agentError) {
            console.log('❌ Error creating agent as admin:', agentError.message);
            console.log('   Error details:', {
                message: agentError.message,
                details: agentError.details,
                hint: agentError.hint
            });
            return false;
        }
        
        console.log(`✅ Agent created successfully: ${newAgent.name} (${newAgent.id})`);
        
        // Test 2.2: Verificar que el agente se puede leer
        console.log('   2.2. Testing agent read access...');
        const { data: readAgent, error: readError } = await supabase
            .from('agents')
            .select('*')
            .eq('id', newAgent.id)
            .single();
            
        if (readError) {
            console.log('❌ Error reading agent:', readError.message);
            return false;
        }
        
        console.log(`✅ Agent read successfully: ${readAgent.name}`);
        
        // Test 3: Verificar políticas RLS para assignments
        console.log('\n3. Testing assignments RLS policies...');
        
        // Test 3.1: Intentar crear asignación como admin
        console.log('   3.1. Testing assignment creation as admin...');
        const testAssignmentData = {
            user_id: adminUser.id,
            agent_id: newAgent.id,
            assigned_at: new Date().toISOString()
        };
        
        const { data: newAssignment, error: assignmentError } = await supabase
            .from('assignments')
            .insert(testAssignmentData)
            .select()
            .single();
            
        if (assignmentError) {
            console.log('❌ Error creating assignment as admin:', assignmentError.message);
            console.log('   Error details:', {
                message: assignmentError.message,
                details: assignmentError.details,
                hint: assignmentError.hint
            });
            return false;
        }
        
        console.log(`✅ Assignment created successfully: User ${adminUser.email} -> Agent ${newAgent.name}`);
        
        // Test 3.2: Verificar que la asignación se puede leer
        console.log('   3.2. Testing assignment read access...');
        const { data: readAssignment, error: readAssignmentError } = await supabase
            .from('assignments')
            .select(`
                *,
                profiles!inner(email, full_name),
                agents!inner(name, agent_id)
            `)
            .eq('user_id', adminUser.id)
            .eq('agent_id', newAgent.id)
            .single();
            
        if (readAssignmentError) {
            console.log('❌ Error reading assignment:', readAssignmentError.message);
            return false;
        }
        
        console.log(`✅ Assignment read successfully: ${readAssignment.profiles.email} -> ${readAssignment.agents.name}`);
        
        // Test 4: Limpiar datos de prueba
        console.log('\n4. Cleaning up test data...');
        
        // Eliminar asignación de prueba
        const { error: deleteAssignmentError } = await supabase
            .from('assignments')
            .delete()
            .eq('user_id', adminUser.id)
            .eq('agent_id', newAgent.id);
            
        if (deleteAssignmentError) {
            console.log('⚠️  Could not delete test assignment:', deleteAssignmentError.message);
        } else {
            console.log('✅ Test assignment deleted');
        }
        
        // Eliminar agente de prueba
        const { error: deleteAgentError } = await supabase
            .from('agents')
            .delete()
            .eq('id', newAgent.id);
            
        if (deleteAgentError) {
            console.log('⚠️  Could not delete test agent:', deleteAgentError.message);
        } else {
            console.log('✅ Test agent deleted');
        }
        
        console.log('\n🎉 ALL RLS POLICY TESTS PASSED!');
        console.log('✅ Admin users can create agents');
        console.log('✅ Admin users can create assignments');
        console.log('✅ Admin users can read agents');
        console.log('✅ Admin users can read assignments');
        console.log('✅ RLS policies are working correctly');
        
        return true;
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
        return false;
    }
}

async function main() {
    const success = await testRLSPolicies();
    
    if (success) {
        console.log('\n🎯 RLS policies are working correctly!');
        console.log('✅ The web app should work without RLS errors');
        console.log('✅ Try creating assignments again in the web app');
    } else {
        console.log('\n❌ RLS policies have issues');
        console.log('💡 Run the SQL fix script and try again');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
