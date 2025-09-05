// ========================================
// FIX BRAVILO DATA UPLOAD
// Ejecutar: node fix-bravilo-data-upload.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('🔧 FIX BRAVILO DATA UPLOAD...\n');

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

// Función para subir datos usando el endpoint correcto
async function uploadDataCorrectly(datastoreId, data) {
    console.log(`📤 Subiendo ${data.length} documentos al datastore ${datastoreId}...`);
    
    try {
        // Intentar diferentes endpoints para subir datos
        
        // 1. Intentar con el endpoint de documentos
        console.log('\n🔄 Intentando endpoint /documents...');
        try {
            const docPayload = {
                documents: data.map(doc => ({
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata
                }))
            };
            
            const result1 = await braviloRequest(`/datastores/${datastoreId}/documents`, 'POST', docPayload);
            if (result1) {
                console.log('✅ Datos subidos exitosamente usando /documents');
                return true;
            }
        } catch (error) {
            console.log('❌ Error con /documents:', error.message);
        }
        
        // 2. Intentar con el endpoint de upsert
        console.log('\n🔄 Intentando endpoint /upsert...');
        try {
            const upsertPayload = {
                documents: data.map(doc => ({
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata
                }))
            };
            
            const result2 = await braviloRequest(`/datastores/${datastoreId}/upsert`, 'POST', upsertPayload);
            if (result2) {
                console.log('✅ Datos subidos exitosamente usando /upsert');
                return true;
            }
        } catch (error) {
            console.log('❌ Error con /upsert:', error.message);
        }
        
        // 3. Intentar con el endpoint de data
        console.log('\n🔄 Intentando endpoint /data...');
        try {
            const dataPayload = {
                data: data.map(doc => ({
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata
                }))
            };
            
            const result3 = await braviloRequest(`/datastores/${datastoreId}/data`, 'POST', dataPayload);
            if (result3) {
                console.log('✅ Datos subidos exitosamente usando /data');
                return true;
            }
        } catch (error) {
            console.log('❌ Error con /data:', error.message);
        }
        
        // 4. Intentar con el endpoint de content
        console.log('\n🔄 Intentando endpoint /content...');
        try {
            const contentPayload = {
                content: data.map(doc => ({
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata
                }))
            };
            
            const result4 = await braviloRequest(`/datastores/${datastoreId}/content`, 'POST', contentPayload);
            if (result4) {
                console.log('✅ Datos subidos exitosamente usando /content');
                return true;
            }
        } catch (error) {
            console.log('❌ Error con /content:', error.message);
        }
        
        // 5. Intentar con el endpoint de query pero sin query (solo documentos)
        console.log('\n🔄 Intentando endpoint /query sin query...');
        try {
            const queryPayload = {
                documents: data.map(doc => ({
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata
                }))
            };
            
            const result5 = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', queryPayload);
            if (result5) {
                console.log('✅ Datos subidos exitosamente usando /query sin query');
                return true;
            }
        } catch (error) {
            console.log('❌ Error con /query sin query:', error.message);
        }
        
        console.log('❌ Todos los endpoints fallaron');
        return false;
        
    } catch (error) {
        console.log('❌ Error subiendo datos:', error.message);
        return false;
    }
}

// Datos de ejemplo para Lente AI
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

// Función para probar consulta después de subir datos
async function testQueryAfterUpload(datastoreId) {
    console.log('\n🔍 Probando consulta después de subir datos...');
    
    try {
        const queryResult = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', {
            query: "Lente AI"
        });
        
        if (queryResult && Array.isArray(queryResult)) {
            console.log(`✅ Consulta exitosa: ${queryResult.length} resultados encontrados`);
            
            queryResult.forEach((item, index) => {
                console.log(`\n📄 Resultado ${index + 1}:`);
                console.log(`   ID: ${item.id || 'N/A'}`);
                console.log(`   Contenido: ${item.content || item.text || 'N/A'}`);
                if (item.metadata) {
                    console.log(`   Metadatos: ${JSON.stringify(item.metadata)}`);
                }
            });
            
            return queryResult.length > 0;
        } else {
            console.log('❌ Consulta no devolvió resultados');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Error en consulta:', error.message);
        return false;
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando corrección de carga de datos...\n');
    
    try {
        // 1. Listar datastores disponibles
        const datastores = await listDatastores();
        
        if (datastores.length === 0) {
            console.log('❌ No hay datastores disponibles');
            return;
        }
        
        // 2. Usar el primer datastore
        const selectedDatastore = datastores[0];
        console.log(`\n🎯 Usando datastore: ${selectedDatastore.name} (${selectedDatastore.id})`);
        
        // 3. Subir datos usando el método correcto
        console.log('\n📤 Subiendo datos de Lente AI...');
        
        const uploadSuccess = await uploadDataCorrectly(selectedDatastore.id, lenteAIData);
        
        if (uploadSuccess) {
            console.log('\n✅ Datos subidos exitosamente');
            
            // 4. Probar consulta
            const querySuccess = await testQueryAfterUpload(selectedDatastore.id);
            
            if (querySuccess) {
                console.log('\n🎉 ¡Problema resuelto! Los datos están funcionando correctamente');
            } else {
                console.log('\n⚠️  Los datos se subieron pero no se pueden consultar');
                console.log('💡 Esto puede indicar un problema de indexación');
            }
        } else {
            console.log('\n❌ No se pudieron subir los datos');
        }
        
    } catch (error) {
        console.error('❌ Error en la corrección:', error.message);
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
    uploadDataCorrectly,
    testQueryAfterUpload
};
