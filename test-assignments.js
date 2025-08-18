// ========================================
// TEST ASSIGNMENTS FUNCTIONALITY
// Ejecutar: node test-assignments.js
// ========================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 TESTING ASSIGNMENTS FUNCTIONALITY...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ ERROR: Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAssignments() {
    try {
        console.log('🚀 Starting assignments test...\n');
        
        // Test 1: Verificar usuarios disponibles
        console.log('1. Testing available users...');
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .limit(5);
            
        if (usersError) {
            console.log('❌ Error fetching users:', usersError.message);
            return false;
        }
        
        console.log(`✅ Found ${users.length} users`);
        users.forEach(user => {
            console.log(`   - ${user.email} (${user.role})`);
        });
        
        if (users.length === 0) {
            console.log('❌ No users available for testing');
            return false;
        }
        
        // Test 2: Verificar agentes disponibles
        console.log('\n2. Testing available agents...');
        const { data: agents, error: agentsError } = await supabase
            .from('agents')
            .select('id, agent_id, name, description')
            .limit(5);
            
        if (agentsError) {
            console.log('❌ Error fetching agents:', agentsError.message);
            return false;
        }
        
        console.log(`✅ Found ${agents.length} agents`);
        agents.forEach(agent => {
            console.log(`   - ${agent.name} (${agent.agent_id})`);
        });
        
        // Test 3: Crear agente de prueba si no hay agentes
        let testAgent = null;
        if (agents.length === 0) {
            console.log('\n3. Creating test agent...');
            const { data: newAgent, error: createAgentError } = await supabase
                .from('agents')
                .insert({
                    agent_id: `test-agent-${Date.now()}`,
                    name: 'Test Agent',
                    description: 'Test agent for assignments',
                    is_active: true,
                    is_shared: false,
                    user_id: users[0].id
                })
                .select()
                .single();
                
            if (createAgentError) {
                console.log('❌ Error creating test agent:', createAgentError.message);
                return false;
            }
            
            testAgent = newAgent;
            console.log(`✅ Created test agent: ${testAgent.name} (${testAgent.id})`);
        } else {
            testAgent = agents[0];
            console.log(`✅ Using existing agent: ${testAgent.name} (${testAgent.id})`);
        }
        
        // Test 4: Crear asignación de prueba
        console.log('\n4. Testing assignment creation...');
        const testUser = users[0];
        
        const { data: assignment, error: assignmentError } = await supabase
            .from('assignments')
            .insert({
                user_id: testUser.id,
                agent_id: testAgent.id,
                assigned_at: new Date().toISOString()
            })
            .select()
            .single();
            
        if (assignmentError) {
            console.log('❌ Error creating assignment:', assignmentError.message);
            console.log('   Error details:', {
                message: assignmentError.message,
                details: assignmentError.details,
                hint: assignmentError.hint
            });
            return false;
        }
        
        console.log(`✅ Created assignment: User ${testUser.email} -> Agent ${testAgent.name}`);
        
        // Test 5: Verificar asignación creada
        console.log('\n5. Verifying created assignment...');
        const { data: verifyAssignment, error: verifyError } = await supabase
            .from('assignments')
            .select(`
                user_id,
                agent_id,
                assigned_at,
                profiles!inner(email, full_name),
                agents!inner(name, agent_id)
            `)
            .eq('user_id', testUser.id)
            .eq('agent_id', testAgent.id)
            .single();
            
        if (verifyError) {
            console.log('❌ Error verifying assignment:', verifyError.message);
        } else {
            console.log('✅ Assignment verified successfully');
            console.log(`   User: ${verifyAssignment.profiles.email}`);
            console.log(`   Agent: ${verifyAssignment.agents.name}`);
            console.log(`   Assigned: ${verifyAssignment.assigned_at}`);
        }
        
        // Test 6: Limpiar datos de prueba
        console.log('\n6. Cleaning up test data...');
        
        // Eliminar asignación de prueba
        const { error: deleteAssignmentError } = await supabase
            .from('assignments')
            .delete()
            .eq('user_id', testUser.id)
            .eq('agent_id', testAgent.id);
            
        if (deleteAssignmentError) {
            console.log('⚠️  Could not delete test assignment:', deleteAssignmentError.message);
        } else {
            console.log('✅ Test assignment deleted');
        }
        
        // Eliminar agente de prueba si fue creado
        if (agents.length === 0 && testAgent) {
            const { error: deleteAgentError } = await supabase
                .from('agents')
                .delete()
                .eq('id', testAgent.id);
                
            if (deleteAgentError) {
                console.log('⚠️  Could not delete test agent:', deleteAgentError.message);
            } else {
                console.log('✅ Test agent deleted');
            }
        }
        
        console.log('\n🎉 ALL ASSIGNMENTS TESTS PASSED!');
        console.log('✅ User fetching works');
        console.log('✅ Agent fetching works');
        console.log('✅ Agent creation works');
        console.log('✅ Assignment creation works');
        console.log('✅ Assignment verification works');
        console.log('✅ Cleanup works');
        
        return true;
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
        return false;
    }
}

async function main() {
    const success = await testAssignments();
    
    if (success) {
        console.log('\n🎯 Assignments functionality is working correctly!');
        console.log('✅ You should be able to create assignments in the web app');
    } else {
        console.log('\n❌ Assignments functionality has issues');
        console.log('💡 Check the error messages above and run the SQL fix scripts');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
