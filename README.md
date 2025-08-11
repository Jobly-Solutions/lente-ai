# Lente AI - Plataforma de Inteligencia Artificial

Una plataforma de IA personalizada para Lente, potenciada por la infraestructura de Bravilo AI.

## 🚀 Características

- **Gestión de Agentes**: Crea y gestiona agentes de inteligencia artificial
- **Datastores**: Administra fuentes de datos para entrenar tus agentes
- **Gestión de Usuarios**: Invita y gestiona usuarios de la plataforma
- **Chat en Tiempo Real**: Conversa con tus agentes de IA
- **Interfaz Moderna**: Diseño responsive y fácil de usar
- **Integración con Bravilo**: Utiliza toda la infraestructura de Bravilo AI

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons
- **API Client**: Axios
- **Form Handling**: React Hook Form
- **Backend Integration**: Bravilo AI APIs

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- API Key de Bravilo AI

## 🚀 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <repository-url>
   cd lente-ai
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp env.example .env.local
   ```

4. **Edita el archivo .env.local**
   ```env
   BRAVILO_API_KEY="tu-api-key-de-bravilo"
   BRAVILO_BASE_URL="https://app.braviloai.com/api"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_NAME="Lente AI"
   ```

5. **Ejecuta el servidor de desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   ```

6. **Abre tu navegador**
   ```
   http://localhost:3000
   ```

## 📁 Estructura del Proyecto

```
lente-ai/
├── app/                    # Páginas de Next.js App Router
│   ├── agents/            # Gestión de agentes
│   ├── datastores/        # Gestión de datastores
│   ├── users/             # Gestión de usuarios
│   ├── chat/              # Interfaz de chat
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/            # Componentes reutilizables
│   ├── layout/           # Componentes de layout
│   └── ui/               # Componentes de UI
├── lib/                  # Utilidades y configuraciones
│   ├── bravilo-api.ts    # Cliente de API de Bravilo
│   └── utils.ts          # Funciones utilitarias
├── public/               # Archivos estáticos
└── package.json          # Dependencias del proyecto
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `BRAVILO_API_KEY` | API Key de Bravilo AI | ✅ |
| `BRAVILO_BASE_URL` | URL base de la API de Bravilo | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL de la aplicación | ✅ |
| `NEXT_PUBLIC_APP_NAME` | Nombre de la aplicación | ✅ |

### Personalización de Marca

Para personalizar la marca de Lente:

1. **Colores**: Edita `tailwind.config.js` para cambiar los colores de marca
2. **Logo**: Reemplaza el ícono en `components/layout/header.tsx`
3. **Nombre**: Cambia "Lente AI" en los archivos de configuración
4. **Favicon**: Reemplaza los archivos en `public/`

## 📱 Funcionalidades

### Dashboard
- Vista general de estadísticas
- Acciones rápidas
- Navegación principal

### Agentes
- Lista de agentes disponibles
- Crear nuevos agentes
- Activar/desactivar agentes
- Editar configuración
- Eliminar agentes

### Datastores
- Gestión de fuentes de datos
- Soporte para múltiples formatos (PDF, CSV, JSON, Texto)
- Subida de archivos
- Conexión con agentes

### Usuarios
- Invitar nuevos usuarios
- Gestión de roles (Admin/Usuario)
- Activar/desactivar usuarios
- Ver perfiles de usuario

### Chat
- Interfaz de chat en tiempo real
- Selección de agentes
- Historial de conversaciones
- Indicadores de estado

## 🔌 Integración con Bravilo

Esta aplicación utiliza las APIs de Bravilo AI para:

- **Gestión de Agentes**: CRUD completo de agentes
- **Datastores**: Administración de fuentes de datos
- **Usuarios**: Gestión de usuarios y permisos
- **Chat**: Conversaciones en tiempo real
- **Autenticación**: Sistema de autenticación

### Endpoints Utilizados

- `GET /api/agents` - Listar agentes
- `POST /api/agents` - Crear agente
- `PUT /api/agents/:id` - Actualizar agente
- `DELETE /api/agents/:id` - Eliminar agente
- `GET /api/datastores` - Listar datastores
- `POST /api/datastores` - Crear datastore
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `POST /api/chat/sessions` - Crear sesión de chat
- `POST /api/chat/sessions/:id/messages` - Enviar mensaje

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Docker

```bash
# Construir imagen
docker build -t lente-ai .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env.local lente-ai
```

### Servidor Tradicional

```bash
# Construir para producción
npm run build

# Iniciar servidor
npm start
```

## 🔒 Seguridad

- Todas las comunicaciones con Bravilo AI usan HTTPS
- Las API keys se almacenan en variables de entorno
- Validación de entrada en formularios
- Sanitización de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:

- **Email**: soporte@lente.ai
- **Documentación**: [docs.lente.ai](https://docs.lente.ai)
- **Issues**: [GitHub Issues](https://github.com/lente-ai/lente-ai/issues)

## 🔄 Actualizaciones

Para mantener la aplicación actualizada:

```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Ejecutar tests
npm test
```

---

**Desarrollado con ❤️ para Lente AI**
