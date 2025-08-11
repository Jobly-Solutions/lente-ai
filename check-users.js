const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUsers() {
  console.log('🔍 Verificando usuarios existentes...')
  
  try {
    // Verificar perfiles
    console.log('\n1. Verificando perfiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Error obteniendo perfiles:', profilesError.message)
    } else {
      console.log(`✅ ${profiles.length} perfiles encontrados:`)
      profiles.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role}) - ${profile.full_name}`)
      })
    }
    
    // Verificar configuración
    console.log('\n2. Verificando configuración...')
    const { data: config, error: configError } = await supabase
      .from('scout_config')
      .select('*')
    
    if (configError) {
      console.error('❌ Error obteniendo configuración:', configError.message)
    } else {
      console.log(`✅ ${config.length} configuraciones encontradas:`)
      config.forEach(c => {
        console.log(`   - API Key: ${c.api_key ? 'Configurada' : 'No configurada'}`)
        console.log(`   - Default Agent: ${c.default_agent_id || 'No configurado'}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

checkUsers()
