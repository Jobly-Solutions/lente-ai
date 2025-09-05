// ========================================
// CHECK DATASTORE CONTENT
// Ejecutar: node check-datastore-content.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('🔍 CHECK DATASTORE CONTENT...\n');

// Configuración de la API de Bravilo
const BRAVILO_API_URL = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api';
const BRAVILO_TOKEN = process.env.BRAVILO_API_KEY;

if (!BRAVILO_TOKEN) {
    console.log('❌ ERROR: BRAVILO_API_KEY no está configurado en .env.local');
    process.exit(1);
}

// Función para hacer requests a la API de Bravilo
async function braviloRequest(endpoint, method = 'GET', data = null) {
    const url = `${BRAVILO_API_URL}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${BRAVILO_TOKEN}`,
        'Content-Type': 'application/json'
    };

    const options = {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) })
    };

    console.log(`🔗 ${method} ${url}`);
    if (data) {
        console.log(`📦 Payload: ${JSON.stringify(data, null, 2)}`);
    }

    try {
        const response = await fetch(url, options);
        const responseText = await response.text();
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { message: responseText };
        }

        console.log(`📥 Response Status: ${response.status}`);
        console.log(`📥 Response: ${JSON.stringify(responseData, null, 2)}`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${responseData.message || response.statusText}`);
        }

        return responseData;
    } catch (error) {
        console.error(`❌ Error en request a ${endpoint}:`, error.message);
        throw error;
    }
}

// Función para listar datastores
async function listDatastores() {
    console.log('📋 Listando datastores...');
    
    try {
        const datastores = await braviloRequest('/datastores');
        return datastores;
    } catch (error) {
        console.log('❌ Error listando datastores:', error.message);
        return [];
    }
}

// Función para obtener información detallada de un datastore
async function getDatastoreInfo(datastoreId) {
    console.log(`\n🔍 Obteniendo información del datastore ${datastoreId}...`);
    
    try {
        const datastore = await braviloRequest(`/datastores/${datastoreId}`);
        return datastore;
    } catch (error) {
        console.log('❌ Error obteniendo información del datastore:', error.message);
        return null;
    }
}

// Función para intentar diferentes endpoints de consulta
async function checkDatastoreContent(datastoreId) {
    console.log(`\n🔍 Verificando contenido del datastore ${datastoreId}...`);
    
    const endpoints = [
        '/documents',
        '/data',
        '/content',
        '/search',
        '/query'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n🔄 Probando endpoint: ${endpoint}`);
            const result = await braviloRequest(`/datastores/${datastoreId}${endpoint}`);
            
            if (result && (Array.isArray(result) || result.documents || result.data)) {
                console.log(`✅ Endpoint ${endpoint} devolvió datos:`);
                console.log(JSON.stringify(result, null, 2));
                return result;
            }
        } catch (error) {
            console.log(`❌ Endpoint ${endpoint} no disponible: ${error.message}`);
        }
    }
    
    return null;
}

// Función para probar consulta con diferentes formatos
async function testQueryFormats(datastoreId) {
    console.log(`\n🔍 Probando diferentes formatos de consulta...`);
    
    const testQueries = [
        { query: "Lente AI", type: "simple" },
        { query: "Lente AI", filter: { category: "Empresa" }, type: "with filter" },
        { query: "Lente AI", limit: 5, type: "with limit" },
        { query: "Lente AI", include_metadata: true, type: "with metadata" }
    ];
    
    for (const testQuery of testQueries) {
        try {
            console.log(`\n🔄 Probando consulta: ${testQuery.type}`);
            const result = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', testQuery);
            
            if (result && Array.isArray(result) && result.length > 0) {
                console.log(`✅ Consulta ${testQuery.type} exitosa:`);
                console.log(JSON.stringify(result, null, 2));
                return result;
            } else {
                console.log(`📄 Consulta ${testQuery.type} devolvió: ${JSON.stringify(result)}`);
            }
        } catch (error) {
            console.log(`❌ Error en consulta ${testQuery.type}: ${error.message}`);
        }
    }
    
    return null;
}

// Función principal
async function main() {
    console.log('🚀 Verificando contenido de datastores...\n');
    
    try {
        // 1. Listar datastores
        const datastores = await listDatastores();
        
        if (datastores.length === 0) {
            console.log('❌ No hay datastores disponibles');
            return;
        }
        
        console.log(`✅ Encontrados ${datastores.length} datastores`);
        
        // 2. Verificar cada datastore
        for (const datastore of datastores) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`DATASTORE: ${datastore.name} (${datastore.id})`);
            console.log(`${'='.repeat(60)}`);
            
            // Información del datastore
            const datastoreInfo = await getDatastoreInfo(datastore.id);
            if (datastoreInfo) {
                console.log('📊 Información del datastore:');
                console.log(`   Nombre: ${datastoreInfo.name}`);
                console.log(`   Tipo: ${datastoreInfo.type}`);
                console.log(`   Visibilidad: ${datastoreInfo.visibility}`);
                console.log(`   Descripción: ${datastoreInfo.description || 'Sin descripción'}`);
                console.log(`   Creado: ${datastoreInfo.createdAt}`);
                console.log(`   Actualizado: ${datastoreInfo.updatedAt}`);
                
                if (datastoreInfo._count) {
                    console.log(`   Datasources: ${datastoreInfo._count.datasources || 0}`);
                }
            }
            
            // Verificar contenido
            const content = await checkDatastoreContent(datastore.id);
            
            // Probar consultas
            const queryResults = await testQueryFormats(datastore.id);
            
            if (!content && !queryResults) {
                console.log('⚠️  No se pudo verificar el contenido del datastore');
            }
        }
        
        console.log('\n🎉 Verificación completada!');
        
    } catch (error) {
        console.error('❌ Error en la verificación:', error.message);
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error inesperado:', error);
        process.exit(1);
    });
}

module.exports = {
    checkDatastoreContent,
    getDatastoreInfo,
    testQueryFormats
};
