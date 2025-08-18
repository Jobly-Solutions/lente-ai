// ========================================
// CHECK ENVIRONMENT VARIABLES
// Ejecutar: node check-env-vars.js
// ========================================

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO...\n');

// Verificar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Variables de entorno:');
console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltante');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltante');

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ ERROR: Variables de entorno faltantes');
    console.log('   Asegúrate de tener un archivo .env.local con:');
    console.log('   NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"');
    console.log('   SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"');
    process.exit(1);
}

// Probar conexión con Supabase
async function testSupabaseConnection() {
    console.log('\n🔗 Probando conexión con Supabase...');
    
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Probar consulta simple
        const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
            
        if (error) {
            console.log('❌ Error de conexión:', error.message);
            console.log('   Verifica que:');
            console.log('   • La URL de Supabase sea correcta');
            console.log('   • La service role key sea válida');
            console.log('   • El proyecto esté activo');
            return false;
        }
        
        console.log('✅ Conexión exitosa con Supabase');
        return true;
        
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
        return false;
    }
}

// Probar autenticación
async function testAuth() {
    console.log('\n🔐 Probando autenticación...');
    
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Probar listar usuarios (requiere service role)
        const { data, error } = await supabase.auth.admin.listUsers();
        
        if (error) {
            console.log('❌ Error de autenticación:', error.message);
            console.log('   Verifica que la service role key tenga permisos de admin');
            return false;
        }
        
        console.log('✅ Autenticación exitosa');
        console.log(`   Usuarios en el sistema: ${data.users?.length || 0}`);
        return true;
        
    } catch (error) {
        console.log('❌ Error de autenticación:', error.message);
        return false;
    }
}

// Probar creación de usuario
async function testUserCreation() {
    console.log('\n👤 Probando creación de usuario...');
    
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'test123456';
        
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
            console.log('❌ Error creando usuario de prueba:', error.message);
            return false;
        }
        
        console.log('✅ Usuario de prueba creado exitosamente');
        console.log(`   ID: ${data.user?.id}`);
        console.log(`   Email: ${data.user?.email}`);
        
        // Limpiar usuario de prueba
        try {
            await supabase.auth.admin.deleteUser(data.user.id);
            console.log('✅ Usuario de prueba eliminado');
        } catch (deleteError) {
            console.log('⚠️  No se pudo eliminar usuario de prueba:', deleteError.message);
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Error en prueba de creación:', error.message);
        return false;
    }
}

// Función principal
async function main() {
    console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...\n');
    
    const connectionOk = await testSupabaseConnection();
    if (!connectionOk) {
        console.log('\n❌ DIAGNÓSTICO FALLIDO: Problemas de conexión');
        process.exit(1);
    }
    
    const authOk = await testAuth();
    if (!authOk) {
        console.log('\n❌ DIAGNÓSTICO FALLIDO: Problemas de autenticación');
        process.exit(1);
    }
    
    const userCreationOk = await testUserCreation();
    if (!userCreationOk) {
        console.log('\n❌ DIAGNÓSTICO FALLIDO: Problemas de creación de usuarios');
        process.exit(1);
    }
    
    console.log('\n🎉 DIAGNÓSTICO COMPLETADO EXITOSAMENTE!');
    console.log('✅ Todas las verificaciones pasaron');
    console.log('✅ El sistema está configurado correctamente');
    console.log('✅ Puedes crear usuarios sin problemas');
}

// Ejecutar diagnóstico
main().catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
});
