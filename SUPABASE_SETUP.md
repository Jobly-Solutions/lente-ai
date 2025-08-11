# Configuración de Supabase para Lente AI

## 🚀 Pasos para Configurar la Base de Datos

### 1. Acceder a Supabase Dashboard

1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: `xcoheosfwpaprfmpmume`

### 2. Ejecutar el Script SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Crea una nueva consulta
3. Copia y pega el contenido del archivo `supabase-setup-final.sql` (RECOMENDADO)
   - Este script elimina tablas existentes y las recrea
   - Respeta el diagrama de base de datos
   - Configuración limpia y funcional
4. Ejecuta el script completo
5. Verás un mensaje de confirmación al final

**Nota:** Este script eliminará todas las tablas existentes y las recreará desde cero

### 3. Verificar las Tablas Creadas

Después de ejecutar el script, deberías ver las siguientes tablas en **Table Editor**:

- ✅ `profiles` - Perfiles de usuarios
- ✅ `agents` - Agentes de IA
- ✅ `assignments` - Asignaciones de agentes a usuarios
- ✅ `conversations` - Historial de conversaciones
- ✅ `scout_config` - Configuración global

### 4. Configurar Autenticación

1. Ve a **Authentication > Settings**
2. En **Site URL**, agrega: `https://ai.lenteconsulting.com`
3. En **Redirect URLs**, agrega:
   - `https://ai.lenteconsulting.com/auth/callback`
   - `http://localhost:3000/auth/callback` (para desarrollo)

### 5. Configurar Políticas de Email

1. Ve a **Authentication > Email Templates**
2. Personaliza los templates de:
   - Confirmación de email
   - Recuperación de contraseña
   - Invitación de usuario

### 6. Crear Usuario Administrador

El usuario `jc.falcon@lenteconsulting.com` será automáticamente asignado como administrador cuando se registre.

Para crear el primer usuario administrador:

1. Registra un usuario con el email `jc.falcon@lenteconsulting.com`
2. El sistema automáticamente le asignará el rol de administrador
3. Este usuario tendrá acceso completo a todas las funciones de administración

### 7. Configurar Storage (Opcional)

Si quieres usar avatares y logos:

1. Ve a **Storage**
2. Crea dos buckets:
   - `avatars` - Para imágenes de perfil
   - `logos` - Para logos de empresas

### 8. Verificar Variables de Entorno

Asegúrate de que tu archivo `.env.local` contenga:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://xcoheosfwpaprfmpmume.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjI4NjIsImV4cCI6MjA2Mjg5ODg2Mn0.FWkzPFNJTBnrIcseg7F9ZscOrFtjYuwXoh8C3ii6HjU"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjb2hlb3Nmd3BhcHJmbXBtdW1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMjg2MiwiZXhwIjoyMDYyODk4ODYyfQ.C5USXdlHD_7Dt9N7I0Vi9O0bzn-IEcVjO-ibNAtc5_w"

# Bravilo API Configuration
BRAVILO_API_KEY="12895462-fdb8-47df-88f6-0976a4e9436e"
BRAVILO_BASE_URL="https://app.braviloai.com/api"
```

## 🔒 Políticas de Seguridad (RLS)

El script configura automáticamente las siguientes políticas:

### Profiles
- Los usuarios pueden ver y editar su propio perfil
- Los administradores pueden ver todos los perfiles

### Agents
- Solo los administradores pueden gestionar agentes

### Assignments
- Solo los administradores pueden gestionar asignaciones

### Conversations
- Los usuarios pueden ver y gestionar sus propias conversaciones
- Los administradores pueden ver todas las conversaciones

### Scout Config
- Solo los administradores pueden acceder a la configuración global

## 🧪 Probar la Configuración

1. Ejecuta la aplicación: `npm run dev`
2. Ve a `http://localhost:3000`
3. Deberías ser redirigido a `/auth/login`
4. Crea una cuenta nueva
5. Verifica que se cree el perfil en Supabase

## 🔧 Solución de Problemas

### Error: "relation 'profiles' does not exist"
- Ejecuta el script SQL completo en Supabase

### Error: "RLS policy violation"
- Verifica que las políticas RLS estén habilitadas
- Asegúrate de que el usuario tenga el rol correcto

### Error: "Invalid JWT"
- Verifica que las variables de entorno estén correctas
- Asegúrate de que la URL de Supabase sea la correcta

### Usuario no se crea automáticamente
- Verifica que el trigger `on_auth_user_created` esté activo
- Revisa los logs en Supabase > Logs

## 📞 Soporte

Si tienes problemas con la configuración:

1. Revisa los logs en Supabase > Logs
2. Verifica que todas las tablas y políticas estén creadas
3. Asegúrate de que las variables de entorno sean correctas
4. Contacta al equipo de desarrollo

---

**¡Listo! Tu aplicación Lente AI está configurada con Supabase.**
