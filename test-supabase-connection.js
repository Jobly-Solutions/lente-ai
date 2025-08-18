// ========================================
// TEST SUPABASE CONNECTION
// Ejecutar: node test-supabase-connection.js
// ========================================

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 TESTING SUPABASE CONNECTION...\n');

// Verificar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Environment Variables:');
console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ ERROR: Missing required environment variables');
    console.log('   Please check your .env.local file');
    process.exit(1);
}

// Crear cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    try {
        console.log('\n🔗 Testing basic connection...');
        
        // Test 1: Basic query
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        if (error) {
            console.log('❌ Basic connection failed:', error.message);
            return false;
        }
        
        console.log('✅ Basic connection successful');
        return true;
        
    } catch (error) {
        console.log('❌ Connection error:', error.message);
        return false;
    }
}

async function testAuthAdmin() {
    try {
        console.log('\n🔐 Testing auth admin...');
        
        // Test 2: Auth admin operations
        const { data, error } = await supabase.auth.admin.listUsers();
        
        if (error) {
            console.log('❌ Auth admin failed:', error.message);
            return false;
        }
        
        console.log('✅ Auth admin successful');
        console.log(`   Users in system: ${data.users?.length || 0}`);
        return true;
        
    } catch (error) {
        console.log('❌ Auth admin error:', error.message);
        return false;
    }
}

async function testUserCreation() {
    try {
        console.log('\n👤 Testing user creation...');
        
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'test123456';
        
        // Test 3: Create user
        const { data, error } = await supabase.auth.admin.createUser({
            email: testEmail,
            password: testPassword,
            email_confirm: true,
            user_metadata: {
                full_name: 'Test User',
                role: 'user'
            }
        });
        
        if (error) {
            console.log('❌ User creation failed:', error.message);
            console.log('   Error details:', {
                message: error.message,
                status: error.status,
                name: error.name
            });
            return false;
        }
        
        console.log('✅ User creation successful');
        console.log(`   User ID: ${data.user?.id}`);
        console.log(`   User Email: ${data.user?.email}`);
        
        // Clean up test user
        try {
            await supabase.auth.admin.deleteUser(data.user.id);
            console.log('✅ Test user cleaned up');
        } catch (deleteError) {
            console.log('⚠️  Could not delete test user:', deleteError.message);
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ User creation error:', error.message);
        return false;
    }
}

async function testDatabaseSchema() {
    try {
        console.log('\n🗄️  Testing database schema...');
        
        // Test 4: Check profiles table
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('❌ Profiles table access failed:', error.message);
            return false;
        }
        
        console.log('✅ Profiles table accessible');
        return true;
        
    } catch (error) {
        console.log('❌ Database schema error:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting comprehensive test...\n');
    
    const connectionOk = await testConnection();
    if (!connectionOk) {
        console.log('\n❌ TEST FAILED: Basic connection issues');
        process.exit(1);
    }
    
    const authOk = await testAuthAdmin();
    if (!authOk) {
        console.log('\n❌ TEST FAILED: Auth admin issues');
        process.exit(1);
    }
    
    const schemaOk = await testDatabaseSchema();
    if (!schemaOk) {
        console.log('\n❌ TEST FAILED: Database schema issues');
        process.exit(1);
    }
    
    const userCreationOk = await testUserCreation();
    if (!userCreationOk) {
        console.log('\n❌ TEST FAILED: User creation issues');
        console.log('\n💡 SUGGESTIONS:');
        console.log('   1. Run the SQL fix scripts in Supabase');
        console.log('   2. Check database permissions');
        console.log('   3. Verify service role key permissions');
        process.exit(1);
    }
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Supabase connection is working');
    console.log('✅ Auth admin is working');
    console.log('✅ Database schema is correct');
    console.log('✅ User creation is working');
    console.log('\n🎯 Your setup is ready for user creation!');
}

main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
