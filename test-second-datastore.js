// ========================================
// TEST SECOND DATASTORE
// Ejecutar: node test-second-datastore.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('🧪 TESTING SECOND DATASTORE...\n');

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
            console.log(`      Datasources: ${datastore._count?.datasources || 0}`);
            console.log(`      Descripción: ${datastore.description || 'Sin descripción'}`);
            console.log('');
        });
        
        return datastores;
    } catch (error) {
        console.log('❌ Error listando datastores:', error.message);
        return [];
    }
}

// Datos de ejemplo para Lente AI
const lenteAIData = [
    {
        id: "lente_company_overview",
        content: "Lente AI es una empresa líder en consultoría de inteligencia artificial. Ofrecemos soluciones personalizadas para empresas que buscan implementar IA en sus procesos de negocio.",
        metadata: {
            source: "company_overview",
            category: "Empresa",
            company: "Lente AI",
            type: "descripción_general"
        }
    },
    {
        id: "lente_services",
        content: "Nuestros servicios incluyen: consultoría en IA, desarrollo de chatbots, análisis de datos, automatización de procesos, implementación de soluciones de machine learning, y optimización de modelos de IA.",
        metadata: {
            source: "services_list",
            category: "Servicios",
            company: "Lente AI",
            type: "lista_servicios"
        }
    },
    {
        id: "lente_contact",
        content: "Para contactar con Lente AI: Email: info@lenteai.com, Teléfono: +1-555-0123, Sitio web: www.lenteai.com, Dirección: Calle Principal 123, Ciudad, País.",
        metadata: {
            source: "contact_info",
            category: "Contacto",
            company: "Lente AI",
            type: "información_contacto"
        }
    },
    {
        id: "lente_expertise",
        content: "Lente AI cuenta con un equipo de expertos en machine learning, procesamiento de lenguaje natural, visión por computadora, y automatización de procesos. Tenemos experiencia en múltiples industrias.",
        metadata: {
            source: "team_expertise",
            category: "Equipo",
            company: "Lente AI",
            type: "expertise_equipo"
        }
    }
];

// Función para probar carga en el segundo datastore
async function testSecondDatastore(datastoreId) {
    console.log(`\n🧪 Probando carga en datastore ${datastoreId}...`);
    
    // Método: Usar /query con query y documents
    console.log('\n🔄 Probando /query con query y documents...');
    try {
        const result = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', {
            query: "upload lente ai data",
            documents: lenteAIData
        });
        console.log('✅ Carga exitosa');
        return true;
    } catch (error) {
        console.log('❌ Error en carga:', error.message);
        return false;
    }
}

// Función para probar consulta después de carga
async function testQuery(datastoreId) {
    console.log('\n🔍 Probando consulta...');
    
    const testQueries = [
        "Lente AI",
        "consultoría IA",
        "servicios inteligencia artificial",
        "machine learning",
        "chatbots"
    ];
    
    for (const query of testQueries) {
        console.log(`\n🔍 Consultando: "${query}"`);
        try {
            const result = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', {
                query: query
            });
            
            if (result && Array.isArray(result)) {
                console.log(`✅ Resultados: ${result.length}`);
                if (result.length > 0) {
                    result.forEach((item, index) => {
                        console.log(`   ${index + 1}. ${item.content?.substring(0, 100)}...`);
                    });
                    return true; // Encontramos resultados
                }
            } else {
                console.log('❌ No devolvió resultados válidos');
            }
        } catch (error) {
            console.log('❌ Error en consulta:', error.message);
        }
    }
    
    return false;
}

// Función principal
async function main() {
    console.log('🚀 Iniciando test del segundo datastore...\n');
    
    try {
        // 1. Listar datastores
        const datastores = await listDatastores();
        
        if (datastores.length < 2) {
            console.log('❌ No hay suficientes datastores');
            return;
        }
        
        // 2. Seleccionar el segundo datastore (que tiene más datasources)
        const selectedDatastore = datastores[1]; // Segundo datastore
        console.log(`🎯 Usando datastore: ${selectedDatastore.name} (${selectedDatastore.id})`);
        console.log(`📊 Datasources existentes: ${selectedDatastore._count?.datasources || 0}`);
        
        // 3. Probar carga
        const uploadSuccess = await testSecondDatastore(selectedDatastore.id);
        
        if (uploadSuccess) {
            console.log('\n✅ Carga exitosa');
            
            // 4. Probar consulta
            const querySuccess = await testQuery(selectedDatastore.id);
            
            if (querySuccess) {
                console.log('\n🎉 ¡Los datos están funcionando correctamente!');
            } else {
                console.log('\n⚠️  Los datos se cargaron pero no se pueden consultar');
                console.log('💡 Esto puede indicar que la API no indexa documentos enviados con consultas');
            }
        } else {
            console.log('\n❌ No se pudo cargar datos');
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
    testSecondDatastore,
    testQuery
};
