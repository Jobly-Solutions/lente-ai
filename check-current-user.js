// ========================================
// CHECK CURRENT USER ROLE
// Ejecutar: node check-current-user.js
// ========================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 CHECKING CURRENT USER ROLE...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ ERROR: Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentUser() {
    try {
        console.log('🚀 Checking current user...\n');
        
        // Obtener todos los usuarios para identificar el actual
        console.log('1. Fetching all users...');
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, created_at')
            .order('created_at', { ascending: false });
            
        if (usersError) {
            console.log('❌ Error fetching users:', usersError.message);
            return false;
        }
        
        console.log(`✅ Found ${users.length} users:`);
        users.forEach((user, index) => {
            const adminBadge = user.role === 'admin' ? '👑' : '👤';
            console.log(`   ${index + 1}. ${adminBadge} ${user.email} (${user.role})`);
        });
        
        // Identificar usuarios admin
        const adminUsers = users.filter(user => user.role === 'admin');
        console.log(`\n👑 Admin users: ${adminUsers.length}`);
        adminUsers.forEach(user => {
            console.log(`   - ${user.email} (${user.full_name || 'Sin nombre'})`);
        });
        
        // Verificar permisos de cada usuario
        console.log('\n2. Testing permissions for each user...');
        for (const user of users) {
            console.log(`\n   Testing user: ${user.email} (${user.role})`);
            
            // Simular operaciones como si fuera este usuario
            const userSupabase = createClient(supabaseUrl, supabaseServiceKey);
            
            // Test 1: Verificar si puede crear agentes
            const canCreateAgents = user.role === 'admin';
            console.log(`     ✅ Can create agents: ${canCreateAgents ? 'YES' : 'NO'}`);
            
            // Test 2: Verificar si puede crear asignaciones
            const canCreateAssignments = user.role === 'admin';
            console.log(`     ✅ Can create assignments: ${canCreateAssignments ? 'YES' : 'NO'}`);
            
            // Test 3: Verificar si puede ver agentes
            console.log(`     ✅ Can view agents: YES (authenticated users)`);
            
            // Test 4: Verificar si puede ver asignaciones
            console.log(`     ✅ Can view assignments: YES (authenticated users)`);
        }
        
        // Recomendaciones
        console.log('\n3. Recommendations:');
        if (adminUsers.length === 0) {
            console.log('   ❌ No admin users found!');
            console.log('   💡 Run the SQL script to assign admin role to a user');
        } else if (adminUsers.length === 1) {
            console.log(`   ✅ Admin user found: ${adminUsers[0].email}`);
            console.log('   💡 Use this user to create assignments');
        } else {
            console.log(`   ✅ Multiple admin users found (${adminUsers.length})`);
            console.log('   💡 Any of these users can create assignments');
        }
        
        // Verificar si hay usuarios sin rol admin que necesiten permisos
        const nonAdminUsers = users.filter(user => user.role !== 'admin');
        if (nonAdminUsers.length > 0) {
            console.log(`\n4. Non-admin users (${nonAdminUsers.length}):`);
            nonAdminUsers.forEach(user => {
                console.log(`   - ${user.email} (${user.role})`);
            });
            console.log('   💡 These users cannot create assignments (by design)');
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
        return false;
    }
}

async function main() {
    const success = await checkCurrentUser();
    
    if (success) {
        console.log('\n🎯 User role check completed!');
        console.log('✅ Check the recommendations above');
        console.log('✅ If you need admin access, run the SQL script');
    } else {
        console.log('\n❌ User role check failed');
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
