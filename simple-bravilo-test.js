// ========================================
// SIMPLE BRAVILO TEST
// Ejecutar: node simple-bravilo-test.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('🧪 SIMPLE BRAVILO TEST...\n');

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
            console.log(`⚠️  Response is not JSON: ${responseText.substring(0, 200)}...`);
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
        console.log(`✅ Encontrados ${datastores.length} datastores:`);
        
        datastores.forEach((datastore, index) => {
            console.log(`   ${index + 1}. ${datastore.name} (${datastore.id})`);
            console.log(`      Tipo: ${datastore.type}`);
            console.log(`      Visibilidad: ${datastore.visibility}`);
            console.log(`      Descripción: ${datastore.description || 'Sin descripción'}`);
            console.log('');
        });
        
        return datastores;
    } catch (error) {
        console.log('❌ Error listando datastores:', error.message);
        return [];
    }
}

// Datos de ejemplo simples
const simpleData = [
    {
        id: "test_doc_1",
        content: "Este es un documento de prueba para Lente AI. Contiene información sobre servicios de inteligencia artificial.",
        metadata: {
            source: "test",
            category: "prueba",
            company: "Lente AI"
        }
    },
    {
        id: "test_doc_2", 
        content: "Lente AI ofrece consultoría en IA, desarrollo de chatbots y análisis de datos.",
        metadata: {
            source: "test",
            category: "servicios",
            company: "Lente AI"
        }
    }
];

// Función para probar diferentes métodos de carga
async function testUploadMethods(datastoreId) {
    console.log(`\n🧪 Probando métodos de carga para datastore ${datastoreId}...`);
    
    // Método 1: Usar /query con query y documents
    console.log('\n🔄 Método 1: /query con query y documents...');
    try {
        const result1 = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', {
            query: "test query",
            documents: simpleData
        });
        console.log('✅ Método 1 exitoso');
        return true;
    } catch (error) {
        console.log('❌ Método 1 falló:', error.message);
    }
    
    // Método 2: Usar /documents
    console.log('\n🔄 Método 2: /documents...');
    try {
        const result2 = await braviloRequest(`/datastores/${datastoreId}/documents`, 'POST', {
            documents: simpleData
        });
        console.log('✅ Método 2 exitoso');
        return true;
    } catch (error) {
        console.log('❌ Método 2 falló:', error.message);
    }
    
    // Método 3: Usar /upsert
    console.log('\n🔄 Método 3: /upsert...');
    try {
        const result3 = await braviloRequest(`/datastores/${datastoreId}/upsert`, 'POST', {
            documents: simpleData
        });
        console.log('✅ Método 3 exitoso');
        return true;
    } catch (error) {
        console.log('❌ Método 3 falló:', error.message);
    }
    
    return false;
}

// Función para probar consulta después de carga
async function testQuery(datastoreId) {
    console.log('\n🔍 Probando consulta...');
    
    try {
        const result = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', {
            query: "Lente AI"
        });
        
        if (result && Array.isArray(result)) {
            console.log(`✅ Consulta exitosa: ${result.length} resultados`);
            result.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.content?.substring(0, 100)}...`);
            });
            return result.length > 0;
        } else {
            console.log('❌ Consulta no devolvió resultados válidos');
            return false;
        }
    } catch (error) {
        console.log('❌ Error en consulta:', error.message);
        return false;
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando test simple...\n');
    
    try {
        // 1. Listar datastores
        const datastores = await listDatastores();
        
        if (datastores.length === 0) {
            console.log('❌ No se encontraron datastores');
            return;
        }
        
        // 2. Seleccionar el primer datastore
        const selectedDatastore = datastores[0];
        console.log(`🎯 Usando datastore: ${selectedDatastore.name} (${selectedDatastore.id})`);
        
        // 3. Probar métodos de carga
        const uploadSuccess = await testUploadMethods(selectedDatastore.id);
        
        if (uploadSuccess) {
            console.log('\n✅ Carga exitosa');
            
            // 4. Probar consulta
            const querySuccess = await testQuery(selectedDatastore.id);
            
            if (querySuccess) {
                console.log('\n🎉 ¡Todo funciona correctamente!');
            } else {
                console.log('\n⚠️  Los datos se cargaron pero no se pueden consultar');
            }
        } else {
            console.log('\n❌ No se pudo cargar datos con ningún método');
        }
        
    } catch (error) {
        console.error('❌ Error en el test:', error.message);
    }
}

// Ejecutar
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    braviloRequest,
    listDatastores,
    testUploadMethods,
    testQuery
};
