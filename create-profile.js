const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createProfile() {
  console.log('🔧 Creando perfil para usuario existente...')
  
  const email = 'jc.falcon@lenteconsulting.com'
  const userId = '5f0f4045-6a1c-4b81-a6f6-913f471a975b' // ID del usuario que encontramos
  
  try {
    // Primero, hacer login para obtener el token de sesión
    console.log('1. Iniciando sesión...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'jc.falcon@lenteconsulting.com'
    })
    
    if (authError) {
      console.error('❌ Error de login:', authError.message)
      return
    }
    
    console.log('✅ Login exitoso')
    
    // Ahora crear el perfil usando el token de sesión
    console.log('\n2. Creando perfil...')
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
    
    console.log('\n🎉 Usuario administrador configurado!')
    console.log('📧 Email:', email)
    console.log('🔑 Contraseña: jc.falcon@lenteconsulting.com')
    console.log('👤 Role: admin')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

createProfile()
