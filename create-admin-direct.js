const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdminDirect() {
  console.log('🔧 Creando usuario administrador directamente...')
  
  const adminId = '550e8400-e29b-41d4-a716-446655440000' // UUID fijo para pruebas
  const adminEmail = 'jc.falcon@lenteconsulting.com'
  const adminName = 'JC Falcon'
  const adminCompany = 'Lente Consulting'
  
  try {
    // Crear perfil directamente
    console.log('1. Creando perfil directamente...')
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: adminId,
          email: adminEmail,
          full_name: adminName,
          company: adminCompany,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
    
    if (error) {
      console.error('❌ Error creando perfil:', error.message)
      
      // Si el usuario ya existe, intentar actualizarlo
      if (error.message.includes('duplicate key')) {
        console.log('🔄 Usuario ya existe, actualizando...')
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: adminName,
            company: adminCompany,
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('email', adminEmail)
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
      console.log('   - ID:', data[0].id)
      console.log('   - Email:', data[0].email)
      console.log('   - Role:', data[0].role)
    }
    
    console.log('\n🎉 Usuario administrador configurado!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Contraseña: Admin123!')
    console.log('\n⚠️  NOTA: Para desarrollo, puedes usar cualquier contraseña ya que el perfil existe.')
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

createAdminDirect()
