#!/bin/bash

echo "🚀 Configurando Lente AI..."
echo "================================"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js 18+ primero."
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versión 18+ es requerida. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error al instalar dependencias"
    exit 1
fi

echo "✅ Dependencias instaladas"

# Crear archivo .env.local si no existe
if [ ! -f .env.local ]; then
    echo "🔧 Creando archivo de configuración..."
    cp env.example .env.local
    echo "✅ Archivo .env.local creado"
    echo "⚠️  IMPORTANTE: Edita .env.local con tu API key de Bravilo"
else
    echo "✅ Archivo .env.local ya existe"
fi

# Verificar si las variables de entorno están configuradas
if grep -q "BRAVILO_API_KEY" .env.local; then
    API_KEY=$(grep "BRAVILO_API_KEY" .env.local | cut -d'=' -f2 | tr -d '"')
    if [ "$API_KEY" = "12895462-fdb8-47df-88f6-0976a4e9436e" ]; then
        echo "⚠️  ADVERTENCIA: Usando API key de ejemplo. Cambia BRAVILO_API_KEY en .env.local"
    else
        echo "✅ API key configurada"
    fi
else
    echo "❌ BRAVILO_API_KEY no encontrada en .env.local"
fi

echo ""
echo "🎉 ¡Configuración completada!"
echo "================================"
echo ""
echo "Para iniciar el servidor de desarrollo:"
echo "  npm run dev"
echo ""
echo "Para construir para producción:"
echo "  npm run build"
echo "  npm start"
echo ""
echo "📖 Lee el README.md para más información"
echo ""
