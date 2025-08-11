const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdminUser() {
  console.log('🔧 Creando usuario administrador...')
  
  const adminEmail = 'jc.falcon@lenteconsulting.com'
  const adminPassword = 'Admin123!'
  const adminName = 'JC Falcon'
  const adminCompany = 'Lente Consulting'
  
  try {
    // 1. Crear usuario en auth.users
    console.log('1. Creando usuario en autenticación...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          full_name: adminName,
          company: adminCompany,
        },
      },
    })
    
    if (authError) {
      console.error('❌ Error creando usuario:', authError.message)
      return
    }
    
    console.log('✅ Usuario creado en autenticación')
    console.log('   - ID:', authData.user?.id)
    console.log('   - Email:', authData.user?.email)
    
    // 2. Verificar si el perfil se creó automáticamente
    console.log('\n2. Verificando perfil...')
    setTimeout(async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', adminEmail)
          .single()
        
        if (profileError) {
          console.log('❌ Error verificando perfil:', profileError.message)
        } else {
          console.log('✅ Perfil encontrado')
          console.log('   - Role:', profileData.role)
          console.log('   - Nombre:', profileData.full_name)
          console.log('   - Empresa:', profileData.company)
        }
      } catch (err) {
        console.log('❌ Error verificando perfil:', err.message)
      }
    }, 2000)
    
    console.log('\n🎉 Usuario administrador creado exitosamente!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Contraseña:', adminPassword)
    console.log('\n⚠️  IMPORTANTE: Verifica tu email para confirmar la cuenta antes de iniciar sesión.')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

createAdminUser()
