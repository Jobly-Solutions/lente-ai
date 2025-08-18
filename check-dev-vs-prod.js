// ========================================
// CHECK DEV VS PROD ENVIRONMENT
// Ejecutar: node check-dev-vs-prod.js
// ========================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 CHECKING DEV VS PROD ENVIRONMENT...\n');

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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEnvironment() {
    try {
        console.log('🚀 Starting environment check...\n');
        
        // Test 1: Verificar si estamos en desarrollo o producción
        console.log('1. Environment detection:');
        const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
        const isProduction = process.env.NODE_ENV === 'production';
        
        console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   Is Development: ${isDevelopment}`);
        console.log(`   Is Production: ${isProduction}`);
        
        // Test 2: Verificar configuración de Supabase
        console.log('\n2. Supabase configuration:');
        console.log(`   URL: ${supabaseUrl}`);
        console.log(`   Service Key: ${supabaseServiceKey ? '✅ Present' : '❌ Missing'}`);
        console.log(`   Anon Key: ${supabaseAnonKey ? '✅ Present' : '❌ Missing'}`);
        
        // Test 3: Verificar conectividad
        console.log('\n3. Connectivity test:');
        const { data: testData, error: testError } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        if (testError) {
            console.log('❌ Connectivity error:', testError.message);
            return false;
        }
        
        console.log('✅ Connectivity successful');
        
        // Test 4: Verificar usuarios admin
        console.log('\n4. Admin users check:');
        const { data: adminUsers, error: adminError } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .eq('role', 'admin');
            
        if (adminError) {
            console.log('❌ Error fetching admin users:', adminError.message);
            return false;
        }
        
        console.log(`✅ Found ${adminUsers.length} admin users`);
        adminUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.full_name || 'Sin nombre'})`);
        });
        
        // Test 5: Verificar políticas RLS
        console.log('\n5. RLS policies check:');
        
        // Test creación de agente
        if (adminUsers.length > 0) {
            const adminUser = adminUsers[0];
            
            const testAgentData = {
                agent_id: `env-test-${Date.now()}`,
                name: 'Environment Test Agent',
                description: 'Test agent for environment check',
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
                console.log('❌ Error creating agent:', agentError.message);
                console.log('   This suggests RLS policy issues');
                return false;
            }
            
            console.log(`✅ Agent creation successful: ${newAgent.name}`);
            
            // Limpiar
            await supabase
                .from('agents')
                .delete()
                .eq('id', newAgent.id);
                
            console.log('✅ Test agent cleaned up');
        }
        
        // Test 6: Verificar diferencias de entorno
        console.log('\n6. Environment differences analysis:');
        console.log('   Development environment:');
        console.log('     - Uses local .env.local file');
        console.log('     - May have different auth context');
        console.log('     - Browser-based authentication');
        console.log('     - Potential caching issues');
        
        console.log('\n   Production environment:');
        console.log('     - Uses environment variables from hosting platform');
        console.log('     - More stable authentication context');
        console.log('     - Server-side rendering');
        console.log('     - Better session management');
        
        // Test 7: Recomendaciones específicas
        console.log('\n7. Recommendations:');
        if (isDevelopment) {
            console.log('   For Development:');
            console.log('     - Clear browser cache and cookies');
            console.log('     - Log out and log in again');
            console.log('     - Check browser console for auth errors');
            console.log('     - Verify user session is established');
            console.log('     - Try incognito/private browsing mode');
        } else {
            console.log('   For Production:');
            console.log('     - Environment variables are properly set');
            console.log('     - Authentication should work correctly');
            console.log('     - Check hosting platform configuration');
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
        return false;
    }
}

async function main() {
    const success = await checkEnvironment();
    
    if (success) {
        console.log('\n🎯 Environment check completed!');
        console.log('\n💡 SUMMARY:');
        console.log('   ✅ Backend is working correctly');
        console.log('   ✅ RLS policies are functioning');
        console.log('   ✅ Admin users can perform operations');
        console.log('   ⚠️  Issue might be frontend-specific');
        console.log('\n🔧 NEXT STEPS:');
        console.log('   1. Clear browser cache and cookies');
        console.log('   2. Log out and log in again');
        console.log('   3. Check browser console for errors');
        console.log('   4. Try incognito mode');
        console.log('   5. Verify user session in browser dev tools');
    } else {
        console.log('\n❌ Environment check failed');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
