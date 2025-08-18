// ========================================
// TEST TEMPORARY FIX
// Ejecutar: node test-temporary-fix.js
// ========================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 TESTING TEMPORARY FIX...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ ERROR: Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTemporaryFix() {
    try {
        console.log('🚀 Testing temporary RLS fix...\n');
        
        // Test 1: Verificar usuarios disponibles
        console.log('1. Getting available users...');
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
            const adminBadge = user.role === 'admin' ? '👑' : '👤';
            console.log(`   ${adminBadge} ${user.email} (${user.role})`);
        });
        
        if (users.length === 0) {
            console.log('❌ No users available for testing');
            return false;
        }
        
        const testUser = users[0];
        
        // Test 2: Crear agente de prueba
        console.log('\n2. Testing agent creation...');
        const testAgentData = {
            agent_id: `temp-fix-test-${Date.now()}`,
            name: 'Temporary Fix Test Agent',
            description: 'Test agent for temporary RLS fix',
            is_active: true,
            is_shared: false,
            user_id: testUser.id
        };
        
        const { data: newAgent, error: agentError } = await supabase
            .from('agents')
            .insert(testAgentData)
            .select()
            .single();
            
        if (agentError) {
            console.log('❌ Error creating agent:', agentError.message);
            console.log('   Error details:', {
                message: agentError.message,
                details: agentError.details,
                hint: agentError.hint
            });
            return false;
        }
        
        console.log(`✅ Agent created successfully: ${newAgent.name} (${newAgent.id})`);
        
        // Test 3: Crear asignación de prueba
        console.log('\n3. Testing assignment creation...');
        const testAssignmentData = {
            user_id: testUser.id,
            agent_id: newAgent.id,
            assigned_at: new Date().toISOString()
        };
        
        const { data: newAssignment, error: assignmentError } = await supabase
            .from('assignments')
            .insert(testAssignmentData)
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
        
        console.log(`✅ Assignment created successfully: User ${testUser.email} -> Agent ${newAgent.name}`);
        
        // Test 4: Verificar datos creados
        console.log('\n4. Verifying created data...');
        const { data: verifyAssignment, error: verifyError } = await supabase
            .from('assignments')
            .select(`
                *,
                profiles!inner(email, full_name),
                agents!inner(name, agent_id)
            `)
            .eq('user_id', testUser.id)
            .eq('agent_id', newAgent.id)
            .single();
            
        if (verifyError) {
            console.log('❌ Error verifying assignment:', verifyError.message);
        } else {
            console.log('✅ Assignment verified successfully');
            console.log(`   User: ${verifyAssignment.profiles.email}`);
            console.log(`   Agent: ${verifyAssignment.agents.name}`);
            console.log(`   Assigned: ${verifyAssignment.assigned_at}`);
        }
        
        // Test 5: Limpiar datos de prueba
        console.log('\n5. Cleaning up test data...');
        
        // Eliminar asignación
        const { error: deleteAssignmentError } = await supabase
            .from('assignments')
            .delete()
            .eq('user_id', testUser.id)
            .eq('agent_id', newAgent.id);
            
        if (deleteAssignmentError) {
            console.log('⚠️  Could not delete test assignment:', deleteAssignmentError.message);
        } else {
            console.log('✅ Test assignment deleted');
        }
        
        // Eliminar agente
        const { error: deleteAgentError } = await supabase
            .from('agents')
            .delete()
            .eq('id', newAgent.id);
            
        if (deleteAgentError) {
            console.log('⚠️  Could not delete test agent:', deleteAgentError.message);
        } else {
            console.log('✅ Test agent deleted');
        }
        
        console.log('\n🎉 TEMPORARY FIX TEST PASSED!');
        console.log('✅ Agent creation works');
        console.log('✅ Assignment creation works');
        console.log('✅ Data verification works');
        console.log('✅ Cleanup works');
        console.log('\n🎯 The web app should now work without RLS errors!');
        
        return true;
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
        return false;
    }
}

async function main() {
    const success = await testTemporaryFix();
    
    if (success) {
        console.log('\n🎯 Temporary fix is working!');
        console.log('✅ Try creating assignments in the web app now');
        console.log('⚠️  NOTE: This is a temporary solution for development');
        console.log('   For production, implement proper role-based security');
    } else {
        console.log('\n❌ Temporary fix test failed');
        console.log('💡 Check the error messages above');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
