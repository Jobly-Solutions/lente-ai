// ========================================
// UPLOAD WITH CURL
// Ejecutar: node upload-with-curl.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('📁 UPLOAD WITH CURL...\n');

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para ejecutar comandos curl
function executeCurl(command) {
    return new Promise((resolve, reject) => {
        console.log(`🔗 Ejecutando: ${command}`);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error ejecutando curl: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.log(`⚠️  stderr: ${stderr}`);
            }
            console.log(`📥 stdout: ${stdout}`);
            resolve(stdout);
        });
    });
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

    const fileName = 'lente-ai-data.json';
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, JSON.stringify(lenteAIData, null, 2));
    console.log(`✅ Archivo creado: ${fileName}`);
    
    return filePath;
}

// Función para obtener datastores
async function getDatastores() {
    console.log('📋 Obteniendo datastores...');
    
    try {
        const result = await executeCurl('curl -s http://localhost:3000/api/datastores');
        const datastores = JSON.parse(result);
        
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
        console.log('❌ Error obteniendo datastores:', error.message);
        return [];
    }
}

// Función para subir archivo usando curl
async function uploadFileWithCurl(datastoreId, filePath, customId = null) {
    console.log(`📤 Subiendo archivo a datastore ${datastoreId} con curl...`);
    
    try {
        const fileName = path.basename(filePath);
        const absolutePath = path.resolve(filePath);
        
        // Construir comando curl
        let curlCommand = `curl -X POST http://localhost:3000/api/datasources`;
        curlCommand += ` -F "file=@${absolutePath}"`;
        curlCommand += ` -F "fileName=${fileName}"`;
        curlCommand += ` -F "type=file"`;
        curlCommand += ` -F "datastoreId=${datastoreId}"`;
        
        if (customId) {
            curlCommand += ` -F "custom_id=${customId}"`;
        }
        
        const result = await executeCurl(curlCommand);
        
        try {
            const response = JSON.parse(result);
            console.log('✅ Archivo subido exitosamente');
            return response;
        } catch (e) {
            console.log('⚠️  Response no es JSON:', result);
            return { message: result };
        }
        
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
            const curlCommand = `curl -X POST http://localhost:3000/api/datastores/${datastoreId}/query`;
            const curlCommandWithData = `${curlCommand} -H "Content-Type: application/json" -d '{"query":"${query}"}'`;
            
            const result = await executeCurl(curlCommandWithData);
            
            try {
                const response = JSON.parse(result);
                if (response && Array.isArray(response)) {
                    console.log(`✅ Resultados: ${response.length}`);
                    if (response.length > 0) {
                        console.log('📄 Documentos encontrados:');
                        response.forEach((item, index) => {
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
            } catch (e) {
                console.log('❌ Error parseando respuesta:', result);
            }
        } catch (error) {
            console.log('❌ Error en consulta:', error.message);
        }
    }
    
    return foundResults;
}

// Función principal
async function main() {
    console.log('🚀 Iniciando carga con curl...\n');
    
    try {
        // 1. Verificar que el servidor esté corriendo
        console.log('🔍 Verificando que el servidor esté corriendo...');
        try {
            await executeCurl('curl -s http://localhost:3000/api/datastores > /dev/null');
            console.log('✅ Servidor web funcionando');
        } catch (error) {
            console.log('❌ Error: El servidor web no está corriendo');
            console.log('💡 Ejecuta: npm run dev');
            return;
        }
        
        // 2. Obtener datastores
        const datastores = await getDatastores();
        
        if (datastores.length === 0) {
            console.log('❌ No se encontraron datastores');
            return;
        }
        
        // 3. Seleccionar el primer datastore
        const selectedDatastore = datastores[0];
        console.log(`🎯 Usando datastore: ${selectedDatastore.name} (${selectedDatastore.id})`);
        console.log(`📊 Datasources existentes: ${selectedDatastore._count?.datasources || 0}`);
        
        // 4. Crear archivo con datos de Lente AI
        console.log('\n📝 Creando archivo con datos de Lente AI...');
        const filePath = createLenteAIFile();
        
        // 5. Subir archivo al datastore
        console.log('\n📤 Subiendo archivo al datastore...');
        const uploadResult = await uploadFileWithCurl(
            selectedDatastore.id, 
            filePath, 
            'lente-ai-company-data'
        );
        
        if (uploadResult) {
            console.log('\n✅ Archivo subido exitosamente');
            console.log('📋 Resultado de la carga:', uploadResult);
            
            // 6. Probar consulta
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
        
        // 7. Limpiar archivo temporal
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
    executeCurl,
    createLenteAIFile,
    getDatastores,
    uploadFileWithCurl,
    testQueryAfterUpload
};


