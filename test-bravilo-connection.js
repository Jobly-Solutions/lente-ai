// ========================================
// TEST BRAVILO CONNECTION
// Ejecutar: node test-bravilo-connection.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('🔍 TEST BRAVILO CONNECTION...\n');

// Configuración de la API de Bravilo
const BRAVILO_API_URL = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api';
const BRAVILO_TOKEN = process.env.BRAVILO_API_KEY;

console.log('📋 Configuración:');
console.log(`   API URL: ${BRAVILO_API_URL}`);
console.log(`   Token: ${BRAVILO_TOKEN ? '✅ Configurado' : '❌ No configurado'}`);
console.log('');

if (!BRAVILO_TOKEN) {
    console.log('❌ ERROR: BRAVILO_API_KEY no está configurado en .env.local');
    process.exit(1);
}

// Función para hacer requests a la API de Bravilo
async function testBraviloRequest(endpoint, method = 'GET', data = null) {
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
        
        console.log(`📥 Response Status: ${response.status}`);
        console.log(`📥 Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
        
        // Intentar parsear como JSON
        let responseData;
        try {
            responseData = JSON.parse(responseText);
            console.log(`📥 Response JSON: ${JSON.stringify(responseData, null, 2)}`);
        } catch (e) {
            console.log(`📥 Response Text (first 500 chars): ${responseText.substring(0, 500)}...`);
            if (responseText.length > 500) {
                console.log(`📥 Response Text (remaining): ...${responseText.substring(500, 1000)}`);
            }
        }

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        return responseData;
    } catch (error) {
        console.error(`❌ Error en request a ${endpoint}:`, error.message);
        throw error;
    }
}

// Función principal
async function main() {
    console.log('🚀 Probando conexión con Bravilo...\n');
    
    try {
        // 1. Probar endpoint básico de datastores
        console.log('1️⃣ Probando endpoint /datastores...');
        const datastores = await testBraviloRequest('/datastores');
        
        if (datastores && Array.isArray(datastores)) {
            console.log(`✅ Encontrados ${datastores.length} datastores`);
            
            if (datastores.length > 0) {
                const firstDatastore = datastores[0];
                console.log(`   Primer datastore: ${firstDatastore.name} (${firstDatastore.id})`);
                
                // 2. Probar query en el primer datastore
                console.log('\n2️⃣ Probando query en el primer datastore...');
                const queryResult = await testBraviloRequest(`/datastores/${firstDatastore.id}/query`, 'POST', {
                    query: "test query"
                });
                
                if (queryResult) {
                    console.log('✅ Query exitosa');
                }
            }
        }
        
        // 3. Probar diferentes URLs de API
        console.log('\n3️⃣ Probando diferentes URLs de API...');
        
        const testUrls = [
            'https://app.braviloai.com/api/datastores',
            'https://api.braviloai.com/datastores',
            'https://braviloai.com/api/datastores'
        ];
        
        for (const testUrl of testUrls) {
            try {
                console.log(`\n🔄 Probando: ${testUrl}`);
                const response = await fetch(testUrl, {
                    headers: {
                        'Authorization': `Bearer ${BRAVILO_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`   Status: ${response.status}`);
                console.log(`   OK: ${response.ok}`);
                
                if (response.ok) {
                    const text = await response.text();
                    console.log(`   Response: ${text.substring(0, 200)}...`);
                }
            } catch (error) {
                console.log(`   Error: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Pruebas completadas!');
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error.message);
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
    testBraviloRequest
};
