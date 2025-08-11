const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createQuickAdmin() {
  try {
    console.log('🔄 Creando usuario administrador rápido...')
    
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@lente.ai',
      password: 'admin123',
      email_confirm: true
    })

    if (authError) {
      console.error('❌ Error creando usuario:', authError)
      return
    }

    console.log('✅ Usuario creado en Auth:', authData.user.email)

    // Crear perfil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'admin@lente.ai',
        full_name: 'Administrador Lente',
        role: 'admin',
        company: 'Lente Consulting'
      })
      .select()

    if (profileError) {
      console.error('❌ Error creando perfil:', profileError)
      return
    }

    console.log('✅ Perfil creado:', profileData)
    console.log('')
    console.log('🎉 Usuario administrador creado exitosamente!')
    console.log('📧 Email: admin@lente.ai')
    console.log('🔑 Password: admin123')
    console.log('')
    console.log('🌐 Accede a: http://localhost:3000')
    console.log('🔐 Inicia sesión con las credenciales de arriba')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

createQuickAdmin()
