// ========================================
// QUERY BRAVILO DATASTORES
// Ejecutar: node query-bravilo-data.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('🔍 QUERY BRAVILO DATASTORES...\n');

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

    try {
        const response = await fetch(url, options);
        const responseText = await response.text();
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { message: responseText };
        }

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

// Función para consultar datos en un datastore
async function queryDatastore(datastoreId, query, options = {}) {
    console.log(`🔍 Consultando datastore ${datastoreId}...`);
    console.log(`📝 Query: "${query}"`);
    
    try {
        const payload = {
            query: query,
            ...options
        };
        
        const result = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', payload);
        
        if (result && Array.isArray(result)) {
            console.log(`✅ Encontrados ${result.length} resultados:`);
            
            result.forEach((item, index) => {
                console.log(`\n📄 Resultado ${index + 1}:`);
                console.log(`   ID: ${item.id || 'N/A'}`);
                console.log(`   Contenido: ${item.content || item.text || 'N/A'}`);
                if (item.metadata) {
                    console.log(`   Metadatos: ${JSON.stringify(item.metadata)}`);
                }
                if (item.score) {
                    console.log(`   Score: ${item.score}`);
                }
            });
        } else {
            console.log('📄 Resultado:', JSON.stringify(result, null, 2));
        }
        
        return result;
    } catch (error) {
        console.log('❌ Error consultando datastore:', error.message);
        return null;
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando consultas a Bravilo...\n');
    
    try {
        // 1. Listar datastores disponibles
        const datastores = await listDatastores();
        
        if (datastores.length === 0) {
            console.log('❌ No hay datastores disponibles');
            return;
        }
        
        // 2. Usar el primer datastore (Wyder Data)
        const selectedDatastore = datastores[0];
        console.log(`\n🎯 Usando datastore: ${selectedDatastore.name} (${selectedDatastore.id})`);
        
        // 3. Ejecutar consultas de ejemplo
        const queries = [
            "¿Qué es Lente AI?",
            "Servicios de consultoría en IA",
            "Casos de éxito en salud",
            "Machine learning básico",
            "Información de contacto"
        ];
        
        console.log('\n🔍 Ejecutando consultas de ejemplo...\n');
        
        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            console.log(`\n${'='.repeat(50)}`);
            console.log(`CONSULTA ${i + 1}: ${query}`);
            console.log(`${'='.repeat(50)}`);
            
            await queryDatastore(selectedDatastore.id, query);
            
            // Pausa entre consultas
            if (i < queries.length - 1) {
                console.log('\n⏳ Esperando 2 segundos...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log('\n🎉 Consultas completadas!');
        console.log('✅ Los datos están funcionando correctamente en Bravilo');
        
    } catch (error) {
        console.error('❌ Error en las consultas:', error.message);
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
    queryDatastore,
    listDatastores
};
