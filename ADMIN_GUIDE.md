# Guía del Administrador - Lente AI

## 👨‍💼 Usuario Administrador

**Email:** `jc.falcon@lenteconsulting.com`  
**Rol:** Administrador Principal  
**Permisos:** Acceso completo a todas las funciones

## 🔐 Funciones Exclusivas del Administrador

### 1. Gestión de Usuarios
- **Crear usuarios:** `/users/new`
- **Ver todos los usuarios:** `/users`
- **Editar perfiles de usuario**
- **Asignar roles (admin/user)**

### 2. Gestión de Agentes
- **Crear agentes:** `/agents/new`
- **Ver todos los agentes:** `/agents`
- **Editar configuración de agentes**
- **Activar/desactivar agentes**
- **Eliminar agentes**

### 3. Gestión de Datastores
- **Crear datastores:** `/datastores/new`
- **Ver todos los datastores:** `/datastores`
- **Subir archivos a datastores**
- **Eliminar datastores**

### 4. Gestión de Asignaciones
- **Asignar agentes a usuarios:** `/admin/assignments`
- **Ver todas las asignaciones**
- **Eliminar asignaciones**
- **Gestionar permisos de acceso**

## 🚀 Flujo de Trabajo Recomendado

### Paso 1: Configuración Inicial
1. **Registrarse** con `jc.falcon@lenteconsulting.com`
2. **Verificar rol de administrador** en el menú de usuario
3. **Configurar agentes** desde `/agents/new`

### Paso 2: Crear Agentes
1. Ve a **Agentes > Crear Agente**
2. Completa la información del agente:
   - Nombre descriptivo
   - Descripción de funciones
   - Configuración de contexto
3. Activa el agente

### Paso 3: Crear Datastores
1. Ve a **Datastores > Crear Datastore**
2. Selecciona el tipo de datos:
   - PDF (documentos)
   - CSV (datos estructurados)
   - JSON (configuraciones)
   - Texto (documentos simples)
3. Sube los archivos necesarios

### Paso 4: Invitar Usuarios
1. Ve a **Usuarios > Invitar Usuario**
2. Completa la información:
   - Nombre completo
   - Email corporativo
   - Empresa
3. El usuario recibirá una invitación por email

### Paso 5: Asignar Agentes
1. Ve a **Asignaciones**
2. Selecciona un usuario
3. Selecciona un agente
4. Confirma la asignación

## 🔒 Políticas de Seguridad

### Acceso por Roles
- **Administradores:** Acceso completo a todas las funciones
- **Usuarios:** Solo pueden acceder a agentes asignados y chat

### Políticas RLS (Row Level Security)
- Los usuarios solo ven sus propios datos
- Los administradores ven todos los datos
- Las asignaciones controlan el acceso a agentes

### Funciones Protegidas
- Crear/editar agentes: Solo administradores
- Crear/editar datastores: Solo administradores
- Invitar usuarios: Solo administradores
- Gestionar asignaciones: Solo administradores

## 📊 Monitoreo y Gestión

### Dashboard de Administrador
- Estadísticas de usuarios activos
- Número de agentes creados
- Datastores disponibles
- Asignaciones activas

### Logs y Auditoría
- Todas las acciones quedan registradas
- Historial de conversaciones por usuario
- Accesos y modificaciones

## 🛠️ Configuración Avanzada

### Personalización de Marca
- Colores de la interfaz
- Logo de la empresa
- Mensajes personalizados

### Configuración de Agentes
- Contexto global
- Mensajes de bienvenida
- Configuración de respuestas

### Gestión de Datos
- Backup de conversaciones
- Exportación de datos
- Limpieza de datos antiguos

## 🔧 Solución de Problemas

### Usuario no puede acceder a agentes
1. Verificar que el usuario esté asignado al agente
2. Comprobar que el agente esté activo
3. Revisar las políticas de acceso

### Error al crear agente
1. Verificar la API key de Bravilo
2. Comprobar la conexión a internet
3. Revisar los logs de error

### Usuario no recibe invitación
1. Verificar el email ingresado
2. Comprobar la configuración de email en Supabase
3. Revisar la carpeta de spam

## 📞 Soporte

Para problemas técnicos o consultas:

1. **Revisar logs** en Supabase Dashboard
2. **Verificar configuración** de variables de entorno
3. **Contactar al equipo** de desarrollo

---

**¡El administrador tiene control total sobre la plataforma Lente AI!**
