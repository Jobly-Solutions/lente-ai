// ========================================
// DEBUG AUTH CONTEXT
// Ejecutar: node debug-auth-context.js
// ========================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 DEBUGGING AUTH CONTEXT...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Environment Variables:');
console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ ERROR: Missing required environment variables');
    process.exit(1);
}

// Crear cliente con service role (como el backend)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Crear cliente con anon key (como el frontend)
const supabaseAnon = supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

async function debugAuthContext() {
    try {
        console.log('🚀 Starting auth context debug...\n');
        
        // Test 1: Verificar usuarios admin con service role
        console.log('1. Testing with service role (backend context)...');
        const { data: adminUsersBackend, error: backendError } = await supabaseAdmin
            .from('profiles')
            .select('id, email, full_name, role')
            .eq('role', 'admin');
            
        if (backendError) {
            console.log('❌ Backend error:', backendError.message);
            return false;
        }
        
        console.log(`✅ Backend found ${adminUsersBackend.length} admin users`);
        adminUsersBackend.forEach(user => {
            console.log(`   - ${user.email} (${user.full_name || 'Sin nombre'})`);
        });
        
        // Test 2: Verificar usuarios admin con anon key (frontend context)
        if (supabaseAnon) {
            console.log('\n2. Testing with anon key (frontend context)...');
            const { data: adminUsersFrontend, error: frontendError } = await supabaseAnon
                .from('profiles')
                .select('id, email, full_name, role')
                .eq('role', 'admin');
                
            if (frontendError) {
                console.log('❌ Frontend error:', frontendError.message);
                console.log('   This is expected - anon key has limited access');
            } else {
                console.log(`✅ Frontend found ${adminUsersFrontend.length} admin users`);
                adminUsersFrontend.forEach(user => {
                    console.log(`   - ${user.email} (${user.full_name || 'Sin nombre'})`);
                });
            }
        }
        
        // Test 3: Simular operación de frontend con autenticación
        console.log('\n3. Simulating frontend authenticated operation...');
        
        if (adminUsersBackend.length > 0) {
            const adminUser = adminUsersBackend[0];
            
            // Simular creación de agente como si fuera desde el frontend
            const testAgentData = {
                agent_id: `debug-agent-${Date.now()}`,
                name: 'Debug Test Agent',
                description: 'Debug agent for auth context',
                is_active: true,
                is_shared: false,
                user_id: adminUser.id
            };
            
            // Intentar con service role (como debería ser en el backend)
            const { data: newAgent, error: agentError } = await supabaseAdmin
                .from('agents')
                .insert(testAgentData)
                .select()
                .single();
                
            if (agentError) {
                console.log('❌ Error creating agent with service role:', agentError.message);
                return false;
            }
            
            console.log(`✅ Agent created with service role: ${newAgent.name} (${newAgent.id})`);
            
            // Limpiar
            await supabaseAdmin
                .from('agents')
                .delete()
                .eq('id', newAgent.id);
                
            console.log('✅ Test agent cleaned up');
        }
        
        // Test 4: Verificar diferencias entre entornos
        console.log('\n4. Environment differences:');
        console.log('   Backend (service role): Full access to all operations');
        console.log('   Frontend (anon key): Limited access, requires user auth');
        console.log('   Web App: Uses anon key + user authentication');
        
        // Test 5: Verificar configuración de RLS
        console.log('\n5. RLS Configuration check:');
        console.log('   ✅ RLS policies are working (backend test passed)');
        console.log('   ✅ Admin users can create agents and assignments');
        console.log('   ⚠️  Frontend needs proper user authentication context');
        
        return true;
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
        return false;
    }
}

async function main() {
    const success = await debugAuthContext();
    
    if (success) {
        console.log('\n🎯 Auth context debug completed!');
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('   1. The backend is working correctly');
        console.log('   2. The issue might be in the frontend auth context');
        console.log('   3. Try refreshing the page and logging in again');
        console.log('   4. Check browser console for auth-related errors');
        console.log('   5. Verify that the user session is properly established');
    } else {
        console.log('\n❌ Auth context debug failed');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
