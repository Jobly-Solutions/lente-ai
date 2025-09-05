// ========================================
// BRAVILO DATA UPLOADER - FORMATO CORRECTO
// Ejecutar: node bravilo-data-uploader.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('📤 BRAVILO DATA UPLOADER - FORMATO CORRECTO...\n');

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
async function uploadDataToDatastore(datastoreId, data) {
    console.log(`📤 Subiendo datos al datastore ${datastoreId}...`);
    
    try {
        // Intentar diferentes formatos según la documentación de Bravilo
        
        // Formato 1: Usando el endpoint de query con documentos
        const queryPayload = {
            query: "test query",
            documents: data.map(doc => ({
                id: doc.id,
                content: doc.content,
                metadata: doc.metadata
            }))
        };
        
        console.log('🔄 Intentando formato de query...');
        const result1 = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', queryPayload);
        
        if (result1) {
            console.log('✅ Datos subidos exitosamente usando formato query');
            return result1;
        }
        
    } catch (error) {
        console.log('❌ Error con formato query:', error.message);
        
        try {
            // Formato 2: Usando el endpoint de documentos directamente
            console.log('🔄 Intentando formato de documentos directos...');
            const docPayload = {
                documents: data.map(doc => ({
                    id: doc.id,
                    content: doc.content,
                    metadata: doc.metadata
                }))
            };
            
            const result2 = await braviloRequest(`/datastores/${datastoreId}/documents`, 'POST', docPayload);
            
            if (result2) {
                console.log('✅ Datos subidos exitosamente usando formato documentos');
                return result2;
            }
            
        } catch (error2) {
            console.log('❌ Error con formato documentos:', error2.message);
            
            try {
                // Formato 3: Usando el endpoint de upsert
                console.log('🔄 Intentando formato de upsert...');
                const upsertPayload = {
                    documents: data.map(doc => ({
                        id: doc.id,
                        content: doc.content,
                        metadata: doc.metadata
                    }))
                };
                
                const result3 = await braviloRequest(`/datastores/${datastoreId}/upsert`, 'POST', upsertPayload);
                
                if (result3) {
                    console.log('✅ Datos subidos exitosamente usando formato upsert');
                    return result3;
                }
                
            } catch (error3) {
                console.log('❌ Error con formato upsert:', error3.message);
                throw new Error('Todos los formatos de carga fallaron');
            }
        }
    }
    
    return null;
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

// Función principal
async function main() {
    console.log('🚀 Iniciando carga de datos a Bravilo...\n');
    
    try {
        // 1. Listar datastores disponibles
        const datastores = await listDatastores();
        
        if (datastores.length === 0) {
            console.log('❌ No hay datastores disponibles');
            return;
        }
        
        // 2. Usar el primer datastore disponible
        const selectedDatastore = datastores[0];
        console.log(`\n🎯 Usando datastore: ${selectedDatastore.name} (${selectedDatastore.id})`);
        
        // 3. Subir datos de Lente AI
        console.log('\n📤 Subiendo datos de Lente AI...');
        
        const success = await uploadDataToDatastore(selectedDatastore.id, lenteAIData);
        
        if (success) {
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

module.exports = {
    uploadDataToDatastore,
    listDatastores
};
