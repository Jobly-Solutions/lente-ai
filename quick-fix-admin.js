// Script para crear el archivo .env.local y reiniciar servidor
const fs = require('fs');

const envContent = `# Bravilo API Configuration
BRAVILO_API_KEY="12895462-fdb8-47df-88f6-0976a4e9436e"
BRAVILO_BASE_URL="https://app.braviloai.com/api"

# Make the API key available on the client side too
NEXT_PUBLIC_BRAVILO_API_KEY="12895462-fdb8-47df-88f6-0976a4e9436e"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://xcoheosfwpaprfmpmume.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Lente AI"`;

try {
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Archivo .env.local creado exitosamente');
  console.log('🔄 Reinicia el servidor: npm run dev');
  console.log('🌐 Ve a: http://localhost:3000/admin-simple');
} catch (error) {
  console.error('❌ Error:', error.message);
}
