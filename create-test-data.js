const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestData() {
  try {
    console.log('🔄 Creando datos de prueba...')
    
    // Crear usuarios de prueba
    const testUsers = [
      {
        email: 'admin@lente.ai',
        password: 'admin123',
        full_name: 'Administrador Lente',
        role: 'admin',
        company: 'Lente Consulting'
      },
      {
        email: 'maria@lente.ai',
        password: 'user123',
        full_name: 'María García',
        role: 'user',
        company: 'Lente Consulting'
      },
      {
        email: 'juan@lente.ai',
        password: 'user123',
        full_name: 'Juan Pérez',
        role: 'user', 
        company: 'Lente Consulting'
      },
      {
        email: 'ana@lente.ai',
        password: 'user123',
        full_name: 'Ana López',
        role: 'user',
        company: 'Lente Consulting'
      }
    ]

    console.log('👥 Creando usuarios...')
    
    for (const user of testUsers) {
      try {
        // Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        })

        if (authError && !authError.message.includes('already registered')) {
          console.error(`❌ Error creando usuario ${user.email}:`, authError.message)
          continue
        }

        // Si el usuario ya existe, obtener su ID
        let userId = authData?.user?.id
        if (!userId) {
          const { data: existingUser } = await supabase.auth.admin.listUsers()
          const found = existingUser.users.find(u => u.email === user.email)
          userId = found?.id
        }

        if (userId) {
          // Crear perfil
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              email: user.email,
              full_name: user.full_name,
              role: user.role,
              company: user.company
            })

          if (profileError && !profileError.message.includes('duplicate key')) {
            console.error(`❌ Error creando perfil ${user.email}:`, profileError.message)
          } else {
            console.log(`✅ Usuario creado: ${user.full_name} (${user.email})`)
          }
        }
      } catch (error) {
        console.error(`❌ Error general ${user.email}:`, error.message)
      }
    }

    // Mostrar resumen
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error obteniendo perfiles:', error)
    } else {
      console.log('\n🎉 Resumen de usuarios creados:')
      console.log(`📊 Total: ${profiles.length} usuarios`)
      profiles.forEach(profile => {
        console.log(`   - ${profile.full_name} (${profile.email}) - ${profile.role}`)
      })
    }

    console.log('\n✅ Datos de prueba creados exitosamente!')
    console.log('🌐 Ve a: http://localhost:3000/admin-simple')
    console.log('🔑 Credenciales de admin: admin@lente.ai / admin123')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

createTestData()
