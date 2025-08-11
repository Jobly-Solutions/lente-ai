const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPerformance() {
  console.log('🚀 Iniciando pruebas de rendimiento...\n')
  
  const testEmail = 'test@performance.com'
  const testPassword = 'test123'
  
  try {
    // 1. Test de conexión a Supabase
    console.log('1. Probando conexión a Supabase...')
    const startTime = Date.now()
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    const connectionTime = Date.now() - startTime
    console.log(`✅ Conexión establecida en ${connectionTime}ms`)
    
    if (sessionError) {
      console.log('⚠️ No hay sesión activa (normal para pruebas)')
    }
    
    // 2. Test de creación de usuario
    console.log('\n2. Probando creación de usuario...')
    const createStart = Date.now()
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Performance',
        role: 'user'
      }
    })
    
    const createTime = Date.now() - createStart
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ Usuario ya existe, continuando con pruebas...')
      } else {
        console.error('❌ Error creando usuario:', authError.message)
        return
      }
    } else {
      console.log(`✅ Usuario creado en ${createTime}ms`)
    }
    
    // 3. Test de login
    console.log('\n3. Probando login...')
    const loginStart = Date.now()
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    const loginTime = Date.now() - loginStart
    
    if (loginError) {
      console.error('❌ Error en login:', loginError.message)
      return
    }
    
    console.log(`✅ Login exitoso en ${loginTime}ms`)
    
    // 4. Test de obtención de perfil
    console.log('\n4. Probando obtención de perfil...')
    const profileStart = Date.now()
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single()
    
    const profileTime = Date.now() - profileStart
    
    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError.message)
    } else {
      console.log(`✅ Perfil obtenido en ${profileTime}ms`)
      console.log(`   - Role: ${profileData.role}`)
      console.log(`   - Nombre: ${profileData.full_name}`)
    }
    
    // 5. Test de logout
    console.log('\n5. Probando logout...')
    const logoutStart = Date.now()
    
    const { error: logoutError } = await supabase.auth.signOut()
    
    const logoutTime = Date.now() - logoutStart
    
    if (logoutError) {
      console.error('❌ Error en logout:', logoutError.message)
    } else {
      console.log(`✅ Logout exitoso en ${logoutTime}ms`)
    }
    
    // 6. Resumen de rendimiento
    console.log('\n📊 RESUMEN DE RENDIMIENTO:')
    console.log(`   - Conexión: ${connectionTime}ms`)
    console.log(`   - Creación de usuario: ${createTime}ms`)
    console.log(`   - Login: ${loginTime}ms`)
    console.log(`   - Obtención de perfil: ${profileTime}ms`)
    console.log(`   - Logout: ${logoutTime}ms`)
    
    const totalTime = connectionTime + createTime + loginTime + profileTime + logoutTime
    console.log(`   - Tiempo total: ${totalTime}ms`)
    
    // 7. Recomendaciones
    console.log('\n💡 RECOMENDACIONES:')
    if (loginTime > 2000) {
      console.log('   ⚠️ Login lento (>2s), considerar optimización')
    } else {
      console.log('   ✅ Login rápido (<2s)')
    }
    
    if (profileTime > 1000) {
      console.log('   ⚠️ Obtención de perfil lenta (>1s), verificar índices de BD')
    } else {
      console.log('   ✅ Obtención de perfil rápida (<1s)')
    }
    
    console.log('\n🎉 Pruebas de rendimiento completadas')
    
  } catch (error) {
    console.error('❌ Error en pruebas de rendimiento:', error.message)
  }
}

// Ejecutar pruebas
testPerformance()
