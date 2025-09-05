// ========================================
// FINAL BRAVILO UPLOAD
// Ejecutar: node final-bravilo-upload.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('🚀 FINAL BRAVILO UPLOAD...\n');

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

// Datos completos de Lente AI
const lenteAIData = [
    {
        id: "lente_company_overview",
        content: "Lente AI es una empresa líder en consultoría de inteligencia artificial. Ofrecemos soluciones personalizadas para empresas que buscan implementar IA en sus procesos de negocio. Nuestra misión es democratizar el acceso a la inteligencia artificial para organizaciones de todos los tamaños.",
        metadata: {
            source: "company_overview",
            category: "Empresa",
            company: "Lente AI",
            type: "descripción_general"
        }
    },
    {
        id: "lente_services",
        content: "Nuestros servicios incluyen: consultoría en IA, desarrollo de chatbots, análisis de datos, automatización de procesos, implementación de soluciones de machine learning, optimización de modelos de IA, procesamiento de lenguaje natural, visión por computadora, y estrategias de transformación digital.",
        metadata: {
            source: "services_list",
            category: "Servicios",
            company: "Lente AI",
            type: "lista_servicios"
        }
    },
    {
        id: "lente_contact",
        content: "Para contactar con Lente AI: Email: info@lenteai.com, Teléfono: +1-555-0123, Sitio web: www.lenteai.com, Dirección: Calle Principal 123, Ciudad, País. Horario de atención: Lunes a Viernes de 9:00 AM a 6:00 PM.",
        metadata: {
            source: "contact_info",
            category: "Contacto",
            company: "Lente AI",
            type: "información_contacto"
        }
    },
    {
        id: "lente_expertise",
        content: "Lente AI cuenta con un equipo de expertos en machine learning, procesamiento de lenguaje natural, visión por computadora, y automatización de procesos. Tenemos experiencia en múltiples industrias incluyendo fintech, healthcare, retail, y manufactura.",
        metadata: {
            source: "team_expertise",
            category: "Equipo",
            company: "Lente AI",
            type: "expertise_equipo"
        }
    },
    {
        id: "lente_ai_concepts",
        content: "Conceptos clave de IA que manejamos: Machine Learning, Deep Learning, Procesamiento de Lenguaje Natural (NLP), Visión por Computadora, Redes Neuronales, Algoritmos de Clasificación, Regresión, Clustering, y Aprendizaje No Supervisado.",
        metadata: {
            source: "ai_concepts",
            category: "Tecnología",
            company: "Lente AI",
            type: "conceptos_ia"
        }
    },
    {
        id: "lente_case_studies",
        content: "Casos de éxito: Implementamos un sistema de análisis de sentimientos para una empresa de retail que mejoró la satisfacción del cliente en un 40%. Desarrollamos un chatbot para atención al cliente que redujo los tiempos de respuesta en un 60%. Creamos un sistema de detección de fraudes que previno pérdidas por $2M anuales.",
        metadata: {
            source: "case_studies",
            category: "Casos de Éxito",
            company: "Lente AI",
            type: "casos_estudio"
        }
    }
];

// Función para cargar datos usando el endpoint correcto
async function uploadDataToDatastore(datastoreId, data) {
    console.log(`📤 Cargando ${data.length} documentos al datastore ${datastoreId}...`);
    
    // Intentar diferentes endpoints basados en la documentación de la API
    
    // Método 1: Usar /documents (endpoint específico para documentos)
    console.log('\n🔄 Método 1: /documents...');
    try {
        const result1 = await braviloRequest(`/datastores/${datastoreId}/documents`, 'POST', {
            documents: data
        });
        console.log('✅ Método 1 exitoso');
        return true;
    } catch (error) {
        console.log('❌ Método 1 falló:', error.message);
    }
    
    // Método 2: Usar /upsert (endpoint para actualizar/insertar)
    console.log('\n🔄 Método 2: /upsert...');
    try {
        const result2 = await braviloRequest(`/datastores/${datastoreId}/upsert`, 'POST', {
            documents: data
        });
        console.log('✅ Método 2 exitoso');
        return true;
    } catch (error) {
        console.log('❌ Método 2 falló:', error.message);
    }
    
    // Método 3: Usar /data (endpoint alternativo)
    console.log('\n🔄 Método 3: /data...');
    try {
        const result3 = await braviloRequest(`/datastores/${datastoreId}/data`, 'POST', {
            data: data
        });
        console.log('✅ Método 3 exitoso');
        return true;
    } catch (error) {
        console.log('❌ Método 3 falló:', error.message);
    }
    
    // Método 4: Usar /content (endpoint alternativo)
    console.log('\n🔄 Método 4: /content...');
    try {
        const result4 = await braviloRequest(`/datastores/${datastoreId}/content`, 'POST', {
            content: data
        });
        console.log('✅ Método 4 exitoso');
        return true;
    } catch (error) {
        console.log('❌ Método 4 falló:', error.message);
    }
    
    console.log('❌ Todos los métodos fallaron');
    return false;
}

// Función para probar consulta después de carga
async function testQueryAfterUpload(datastoreId) {
    console.log('\n🔍 Probando consulta después de la carga...');
    
    const testQueries = [
        "Lente AI",
        "consultoría IA",
        "servicios inteligencia artificial",
        "machine learning",
        "chatbots",
        "procesamiento lenguaje natural"
    ];
    
    let foundResults = false;
    
    for (const query of testQueries) {
        console.log(`\n🔍 Consultando: "${query}"`);
        try {
            const result = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', {
                query: query
            });
            
            if (result && Array.isArray(result)) {
                console.log(`✅ Resultados: ${result.length}`);
                if (result.length > 0) {
                    console.log('📄 Documentos encontrados:');
                    result.forEach((item, index) => {
                        console.log(`   ${index + 1}. ${item.content?.substring(0, 150)}...`);
                        if (item.metadata) {
                            console.log(`      Metadata: ${JSON.stringify(item.metadata)}`);
                        }
                    });
                    foundResults = true;
                }
            } else {
                console.log('❌ No devolvió resultados válidos');
            }
        } catch (error) {
            console.log('❌ Error en consulta:', error.message);
        }
    }
    
    return foundResults;
}

// Función principal
async function main() {
    console.log('🚀 Iniciando carga final de datos...\n');
    
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
        console.log(`📊 Datasources existentes: ${selectedDatastore._count?.datasources || 0}`);
        
        // 3. Cargar datos usando el método correcto
        console.log('\n📤 Cargando datos de Lente AI...');
        const uploadSuccess = await uploadDataToDatastore(selectedDatastore.id, lenteAIData);
        
        if (uploadSuccess) {
            console.log('\n✅ Datos cargados exitosamente');
            
            // 4. Probar consulta
            const querySuccess = await testQueryAfterUpload(selectedDatastore.id);
            
            if (querySuccess) {
                console.log('\n🎉 ¡ÉXITO! Los datos están funcionando correctamente');
                console.log('✅ Los datos se cargaron y se pueden consultar');
            } else {
                console.log('\n⚠️  Los datos se cargaron pero no se pueden consultar');
                console.log('💡 Esto puede indicar que necesitamos usar un endpoint diferente');
            }
        } else {
            console.log('\n❌ No se pudieron cargar los datos');
            console.log('💡 Revisar la documentación de la API para el endpoint correcto');
        }
        
    } catch (error) {
        console.error('❌ Error en la carga:', error.message);
    }
}

// Ejecutar
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    braviloRequest,
    listDatastores,
    uploadDataToDatastore,
    testQueryAfterUpload
};
