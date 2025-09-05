// ========================================
// UPLOAD DATA TO BRAVILO DATASTORES
// Ejecutar: node upload-data-to-bravilo.js
// ========================================

require('dotenv').config({ path: '.env.local' });
const { listDatastores, getDatastore, uploadDataToDatastore } = require('./bravilo-datastore-manager.js');

// Verificar configuración de Bravilo
const BRAVILO_TOKEN = process.env.BRAVILO_API_KEY;
if (!BRAVILO_TOKEN) {
    console.log('❌ ERROR: BRAVILO_API_KEY no está configurado en .env.local');
    process.exit(1);
}

console.log('📤 UPLOAD DATA TO BRAVILO DATASTORES...\n');

// Datos de ejemplo para subir
const sampleData = [
    {
        "id": "doc1",
        "content": "Este es un documento de ejemplo sobre inteligencia artificial y machine learning.",
        "metadata": {
            "source": "documento_ejemplo",
            "category": "AI/ML",
            "date": "2024-01-15"
        }
    },
    {
        "id": "doc2", 
        "content": "La inteligencia artificial está transformando la forma en que trabajamos y vivimos.",
        "metadata": {
            "source": "articulo_ai",
            "category": "Tecnología",
            "date": "2024-01-16"
        }
    },
    {
        "id": "doc3",
        "content": "Machine learning es una rama de la inteligencia artificial que permite a las computadoras aprender sin ser programadas explícitamente.",
        "metadata": {
            "source": "definicion_ml",
            "category": "Educación",
            "date": "2024-01-17"
        }
    }
];

// Datos específicos para Lente AI
const lenteAIData = [
    {
        "id": "lente_company_info",
        "content": "Lente AI es una empresa especializada en inteligencia artificial y consultoría tecnológica. Ofrecemos soluciones personalizadas para empresas que buscan implementar IA en sus procesos.",
        "metadata": {
            "source": "company_profile",
            "category": "Empresa",
            "company": "Lente AI"
        }
    },
    {
        "id": "lente_services",
        "content": "Nuestros servicios incluyen: consultoría en IA, desarrollo de chatbots, análisis de datos, automatización de procesos, y implementación de soluciones de machine learning.",
        "metadata": {
            "source": "services_list",
            "category": "Servicios",
            "company": "Lente AI"
        }
    },
    {
        "id": "lente_contact",
        "content": "Para contactar con Lente AI: Email: info@lenteai.com, Teléfono: +1-555-0123, Sitio web: www.lenteai.com",
        "metadata": {
            "source": "contact_info",
            "category": "Contacto",
            "company": "Lente AI"
        }
    }
];

// Función para subir datos a un datastore específico
async function uploadDataToSpecificDatastore(datastoreId, data, dataType = 'general') {
    console.log(`📤 Subiendo datos de tipo "${dataType}" al datastore ${datastoreId}...`);
    
    try {
        // Preparar los datos para la API de Bravilo
        const uploadPayload = {
            documents: data.map(doc => ({
                id: doc.id,
                content: doc.content,
                metadata: doc.metadata
            }))
        };
        
        console.log(`   Subiendo ${data.length} documentos...`);
        
        const result = await uploadDataToDatastore(datastoreId, uploadPayload);
        
        if (result) {
            console.log(`✅ Datos de tipo "${dataType}" subidos exitosamente`);
            console.log(`   Documentos procesados: ${data.length}`);
            return true;
        } else {
            console.log(`❌ Error subiendo datos de tipo "${dataType}"`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error subiendo datos de tipo "${dataType}":`, error.message);
        return false;
    }
}

// Función para subir datos desde un archivo
async function uploadDataFromFile(datastoreId, filePath) {
    console.log(`📁 Subiendo datos desde archivo: ${filePath}`);
    
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Verificar que el archivo existe
        if (!fs.existsSync(filePath)) {
            console.log(`❌ Archivo no encontrado: ${filePath}`);
            return false;
        }
        
        // Leer el archivo
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let data;
        
        // Intentar parsear como JSON
        try {
            data = JSON.parse(fileContent);
        } catch (parseError) {
            console.log('❌ Error parseando archivo JSON:', parseError.message);
            return false;
        }
        
        // Verificar que data es un array
        if (!Array.isArray(data)) {
            console.log('❌ El archivo debe contener un array de documentos');
            return false;
        }
        
        // Subir los datos
        return await uploadDataToSpecificDatastore(datastoreId, data, 'archivo');
        
    } catch (error) {
        console.log('❌ Error leyendo archivo:', error.message);
        return false;
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando carga de datos a Bravilo...\n');
    
    try {
        // 1. Listar datastores disponibles
        const datastores = await listDatastores();
        
        if (datastores.length === 0) {
            console.log('❌ No hay datastores disponibles');
            console.log('💡 Primero crea un datastore usando: node bravilo-datastore-manager.js');
            return;
        }
        
        // 2. Mostrar datastores disponibles
        console.log('\n📋 Datastores disponibles:');
        datastores.forEach((datastore, index) => {
            console.log(`   ${index + 1}. ${datastore.name} (${datastore.id})`);
        });
        
        // 3. Usar el primer datastore disponible (puedes modificar esto para usar uno específico)
        const selectedDatastore = datastores[0];
        console.log(`\n🎯 Usando datastore: ${selectedDatastore.name} (${selectedDatastore.id})`);
        
        // 4. Subir datos de ejemplo
        console.log('\n📤 Subiendo datos de ejemplo...');
        
        // Subir datos generales
        const generalSuccess = await uploadDataToSpecificDatastore(
            selectedDatastore.id, 
            sampleData, 
            'general'
        );
        
        // Subir datos específicos de Lente AI
        const lenteAISuccess = await uploadDataToSpecificDatastore(
            selectedDatastore.id, 
            lenteAIData, 
            'Lente AI'
        );
        
        // 5. Opción para subir desde archivo
        console.log('\n📁 Para subir datos desde un archivo:');
        console.log('   Ejemplo: uploadDataFromFile(datastoreId, "./mi-datos.json")');
        console.log('   El archivo debe contener un array de documentos con formato:');
        console.log('   [{ "id": "doc1", "content": "texto", "metadata": {...} }]');
        
        // 6. Resumen
        console.log('\n📊 RESUMEN DE CARGA:');
        console.log(`   Datastore: ${selectedDatastore.name}`);
        console.log(`   Datos generales: ${generalSuccess ? '✅' : '❌'}`);
        console.log(`   Datos Lente AI: ${lenteAISuccess ? '✅' : '❌'}`);
        
        if (generalSuccess || lenteAISuccess) {
            console.log('\n🎉 Carga de datos completada!');
            console.log('✅ Los datos están disponibles en tu datastore de Bravilo');
        } else {
            console.log('\n❌ No se pudieron subir los datos');
        }
        
    } catch (error) {
        console.error('❌ Error en la carga de datos:', error.message);
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error inesperado:', error);
        process.exit(1);
    });
}

// Exportar funciones para uso en otros scripts
module.exports = {
    uploadDataToSpecificDatastore,
    uploadDataFromFile,
    sampleData,
    lenteAIData
};
