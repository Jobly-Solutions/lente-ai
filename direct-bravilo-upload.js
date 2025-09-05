// ========================================
// DIRECT BRAVILO UPLOAD
// Ejecutar: node direct-bravilo-upload.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('🚀 DIRECT BRAVILO UPLOAD...\n');

// Configuración de la API de Bravilo
const BRAVILO_API_URL = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api';
const BRAVILO_TOKEN = process.env.BRAVILO_API_KEY;

if (!BRAVILO_TOKEN) {
    console.log('❌ ERROR: BRAVILO_API_KEY no está configurado en .env.local');
    process.exit(1);
}

// Función para hacer requests a la API de Bravilo
async function braviloRequest(endpoint, method = 'GET', data = null, isFormData = false) {
    const url = `${BRAVILO_API_URL}${endpoint}`;
    
    let headers = {
        'Authorization': `Bearer ${BRAVILO_TOKEN}`
    };
    
    // No agregar Content-Type para FormData, el navegador lo hace automáticamente
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    const options = {
        method,
        headers,
        ...(data && { body: data })
    };

    console.log(`🔗 ${method} ${url}`);
    if (data && !isFormData) {
        console.log(`📦 Payload: ${JSON.stringify(data, null, 2)}`);
    } else if (isFormData) {
        console.log(`📦 FormData: Archivo y metadatos`);
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

// Función para crear un archivo JSON con los datos de Lente AI
function createLenteAIFile() {
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
            id: "lente_industries",
            content: "Lente AI trabaja con empresas de diversos sectores: tecnología, finanzas, salud, retail, manufactura, logística, educación, y servicios profesionales. Nuestra experiencia abarca desde startups hasta grandes corporaciones.",
            metadata: {
                source: "industries",
                category: "Industrias",
                company: "Lente AI",
                type: "sectores_servicio"
            }
        },
        {
            id: "lente_expertise",
            content: "Nuestro equipo cuenta con expertos en machine learning, deep learning, procesamiento de lenguaje natural, visión por computadora, análisis predictivo, automatización de procesos, y estrategias de transformación digital.",
            metadata: {
                source: "expertise",
                category: "Expertise",
                company: "Lente AI",
                type: "conocimientos_equipo"
            }
        }
    ];

    const fs = require('fs');
    const path = require('path');
    
    const fileName = 'lente-ai-data.json';
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(lenteAIData, null, 2));
    console.log(`✅ Archivo creado: ${fileName}`);
    
    return filePath;
}

// Función para subir archivo directamente a Bravilo
async function uploadFileDirectly(datastoreId, filePath, customId = null) {
    console.log(`📤 Subiendo archivo directamente a datastore ${datastoreId}...`);
    
    try {
        const fs = require('fs');
        const FormData = require('form-data');
        
        // Crear FormData
        const form = new FormData();
        
        // Leer el archivo
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = require('path').basename(filePath);
        
        // Agregar campos al FormData (exactamente como lo hace la API web)
        form.append('file', fileBuffer, {
            filename: fileName,
            contentType: 'application/json'
        });
        form.append('fileName', fileName);
        form.append('type', 'file');
        form.append('datastoreId', datastoreId);
        
        if (customId) {
            form.append('custom_id', customId);
        }
        
        // Obtener los headers del FormData
        const formHeaders = form.getHeaders();
        
        // Hacer la request directamente a Bravilo
        const url = `${BRAVILO_API_URL}/datasources`;
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BRAVILO_TOKEN}`,
                ...formHeaders
            },
            body: form
        };

        console.log(`🔗 POST ${url}`);
        console.log(`📦 FormData: Archivo y metadatos`);
        console.log(`📋 Headers: ${JSON.stringify(formHeaders, null, 2)}`);

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

        console.log('✅ Archivo subido exitosamente');
        return responseData;
        
    } catch (error) {
        console.log('❌ Error subiendo archivo:', error.message);
        throw error;
    }
}

// Función para probar consulta después de la carga
async function testQueryAfterUpload(datastoreId) {
    console.log('\n🔍 Probando consulta después de la carga...');
    
    const testQueries = [
        "Lente AI",
        "consultoría IA",
        "servicios inteligencia artificial",
        "machine learning"
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
    console.log('🚀 Iniciando carga directa a Bravilo...\n');
    
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
        
        // 3. Crear archivo con datos de Lente AI
        console.log('\n📝 Creando archivo con datos de Lente AI...');
        const filePath = createLenteAIFile();
        
        // 4. Subir archivo al datastore
        console.log('\n📤 Subiendo archivo al datastore...');
        const uploadResult = await uploadFileDirectly(
            selectedDatastore.id, 
            filePath, 
            'lente-ai-company-data'
        );
        
        if (uploadResult) {
            console.log('\n✅ Archivo subido exitosamente');
            console.log('📋 Resultado de la carga:', uploadResult);
            
            // 5. Probar consulta
            console.log('\n⏳ Esperando 10 segundos para que se procese el archivo...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            const querySuccess = await testQueryAfterUpload(selectedDatastore.id);
            
            if (querySuccess) {
                console.log('\n🎉 ¡ÉXITO! Los datos están funcionando correctamente');
                console.log('✅ El archivo se subió y se puede consultar');
            } else {
                console.log('\n⚠️  El archivo se subió pero no se pueden consultar los datos');
                console.log('💡 Esto puede indicar que el archivo aún se está procesando');
                console.log('💡 Intenta consultar más tarde desde la interfaz web');
            }
        } else {
            console.log('\n❌ No se pudo subir el archivo');
        }
        
        // 6. Limpiar archivo temporal
        const fs = require('fs');
        try {
            fs.unlinkSync(filePath);
            console.log('\n🧹 Archivo temporal eliminado');
        } catch (e) {
            console.log('\n⚠️  No se pudo eliminar el archivo temporal');
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
    createLenteAIFile,
    uploadFileDirectly,
    testQueryAfterUpload
};


