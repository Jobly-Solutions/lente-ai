const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xcoheosfwpaprfmpmume.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSupabase() {
  console.log('🔍 Probando conexión con Supabase...')
  
  try {
    // 1. Probar conexión básica
    console.log('1. Probando conexión básica...')
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    
    if (error) {
      console.error('❌ Error de conexión:', error.message)
      return
    }
    
    console.log('✅ Conexión exitosa')
    
    // 2. Verificar si las tablas existen
    console.log('\n2. Verificando tablas...')
    
    const tables = ['profiles', 'agents', 'assignments', 'conversations', 'scout_config']
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          console.log(`❌ Tabla ${table}: ${error.message}`)
        } else {
          console.log(`✅ Tabla ${table}: OK`)
        }
      } catch (err) {
        console.log(`❌ Tabla ${table}: ${err.message}`)
      }
    }
    
    // 3. Verificar función RPC
    console.log('\n3. Verificando función RPC...')
    try {
      const { data, error } = await supabase.rpc('get_all_agents')
      if (error) {
        console.log(`❌ Función RPC: ${error.message}`)
      } else {
        console.log(`✅ Función RPC: OK`)
      }
    } catch (err) {
      console.log(`❌ Función RPC: ${err.message}`)
    }
    
    // 4. Verificar configuración inicial
    console.log('\n4. Verificando configuración inicial...')
    try {
      const { data, error } = await supabase.from('scout_config').select('*')
      if (error) {
        console.log(`❌ Configuración: ${error.message}`)
      } else {
        console.log(`✅ Configuración: ${data.length} registros encontrados`)
        if (data.length > 0) {
          console.log('   - API Key configurada:', data[0].api_key ? 'Sí' : 'No')
        }
      }
    } catch (err) {
      console.log(`❌ Configuración: ${err.message}`)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

testSupabase()
