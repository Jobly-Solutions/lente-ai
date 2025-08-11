const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('🔍 Probando login...')
  
  const email = 'jc.falcon@lenteconsulting.com'
  const password = 'jc.falcon@lenteconsulting.com'
  
  try {
    console.log('1. Intentando login...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (error) {
      console.error('❌ Error de login:', error.message)
      return
    }
    
    console.log('✅ Login exitoso!')
    console.log('   - User ID:', data.user?.id)
    console.log('   - Email:', data.user?.email)
    console.log('   - Session:', data.session ? 'Creada' : 'No creada')
    
    // Verificar perfil
    console.log('\n2. Verificando perfil...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError.message)
    } else {
      console.log('✅ Perfil encontrado:')
      console.log('   - Role:', profile.role)
      console.log('   - Nombre:', profile.full_name)
      console.log('   - Empresa:', profile.company)
    }
    
    // Verificar sesión
    console.log('\n3. Verificando sesión actual...')
    const { data: sessionData } = await supabase.auth.getSession()
    console.log('   - Sesión activa:', sessionData.session ? 'Sí' : 'No')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

testLogin()
