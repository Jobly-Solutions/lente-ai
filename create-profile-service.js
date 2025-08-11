const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w'

// Usar la clave de servicio para bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createProfileService() {
  console.log('🔧 Creando perfil usando clave de servicio...')
  
  const email = 'jc.falcon@lenteconsulting.com'
  const userId = '5f0f4045-6a1c-4b81-a6f6-913f471a975b'
  
  try {
    console.log('1. Creando perfil con permisos de servicio...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: email,
          full_name: 'JC Falcon',
          company: 'Lente Consulting',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (profileError) {
      console.error('❌ Error creando perfil:', profileError.message)
      
      // Si ya existe, intentar actualizar
      if (profileError.message.includes('duplicate key')) {
        console.log('🔄 Perfil ya existe, actualizando...')
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: 'JC Falcon',
            company: 'Lente Consulting',
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
        
        if (updateError) {
          console.error('❌ Error actualizando perfil:', updateError.message)
        } else {
          console.log('✅ Perfil actualizado exitosamente')
          console.log('   - Email:', updateData[0].email)
          console.log('   - Role:', updateData[0].role)
        }
      }
    } else {
      console.log('✅ Perfil creado exitosamente')
      console.log('   - ID:', profileData[0].id)
      console.log('   - Email:', profileData[0].email)
      console.log('   - Role:', profileData[0].role)
    }
    
    // Verificar que se creó correctamente
    console.log('\n2. Verificando perfil creado...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    
    if (verifyError) {
      console.error('❌ Error verificando perfil:', verifyError.message)
    } else {
      console.log('✅ Perfil verificado:')
      console.log('   - ID:', verifyData.id)
      console.log('   - Email:', verifyData.email)
      console.log('   - Role:', verifyData.role)
      console.log('   - Nombre:', verifyData.full_name)
    }
    
    console.log('\n🎉 Usuario administrador configurado exitosamente!')
    console.log('📧 Email:', email)
    console.log('🔑 Contraseña: jc.falcon@lenteconsulting.com')
    console.log('👤 Role: admin')
    console.log('\n✅ Ahora puedes iniciar sesión en la aplicación')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

createProfileService()
