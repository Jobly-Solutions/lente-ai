const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUser() {
  console.log('🔍 Verificando usuario específico...')
  
  const email = 'jc.falcon@lenteconsulting.com'
  
  try {
    // Verificar si existe en perfiles
    console.log(`\n1. Verificando perfil para: ${email}`)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    
    if (profileError) {
      console.log('❌ Usuario no encontrado en perfiles:', profileError.message)
    } else {
      console.log('✅ Usuario encontrado en perfiles:')
      console.log('   - ID:', profile.id)
      console.log('   - Email:', profile.email)
      console.log('   - Role:', profile.role)
      console.log('   - Nombre:', profile.full_name)
    }
    
    // Intentar login para verificar si existe en auth.users
    console.log('\n2. Verificando autenticación...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'jc.falcon@lenteconsulting.com'
    })
    
    if (authError) {
      console.log('❌ Error de autenticación:', authError.message)
    } else {
      console.log('✅ Usuario existe en autenticación:')
      console.log('   - ID:', authData.user?.id)
      console.log('   - Email:', authData.user?.email)
      console.log('   - Email confirmado:', authData.user?.email_confirmed_at ? 'Sí' : 'No')
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

checkUser()
