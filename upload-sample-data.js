// ========================================
// UPLOAD SAMPLE DATA TO BRAVILO
// Ejecutar: node upload-sample-data.js
// ========================================

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

console.log('📤 UPLOAD SAMPLE DATA TO BRAVILO...\n');

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

// Función para subir datos al datastore
async function uploadDataToDatastore(datastoreId, data) {
    console.log(`📤 Subiendo ${data.length} documentos al datastore ${datastoreId}...`);
    
    try {
        // Usar el formato que funcionó (query con documentos)
        const payload = {
            query: "upload sample data",
            documents: data.map(doc => ({
                id: doc.id,
                content: doc.content,
                metadata: doc.metadata
            }))
        };
        
        const result = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', payload);
        
        if (result) {
            console.log(`✅ ${data.length} documentos subidos exitosamente`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.log('❌ Error subiendo datos:', error.message);
        return false;
    }
}

// Función para cargar datos desde el archivo
function loadSampleData() {
    try {
        const filePath = './sample-data.json';
        
        if (!fs.existsSync(filePath)) {
            console.log(`❌ Archivo no encontrado: ${filePath}`);
            return null;
        }
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        
        if (!Array.isArray(data)) {
            console.log('❌ El archivo debe contener un array de documentos');
            return null;
        }
        
        console.log(`📁 Cargados ${data.length} documentos desde sample-data.json`);
        return data;
        
    } catch (error) {
        console.log('❌ Error cargando datos del archivo:', error.message);
        return null;
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando carga de datos de ejemplo...\n');
    
    try {
        // 1. Cargar datos del archivo
        const sampleData = loadSampleData();
        
        if (!sampleData) {
            console.log('❌ No se pudieron cargar los datos del archivo');
            return;
        }
        
        // 2. Listar datastores disponibles
        const datastores = await listDatastores();
        
        if (datastores.length === 0) {
            console.log('❌ No hay datastores disponibles');
            return;
        }
        
        // 3. Mostrar opciones de datastore
        console.log('\n📋 Selecciona un datastore para subir los datos:');
        datastores.forEach((datastore, index) => {
            console.log(`   ${index + 1}. ${datastore.name} (${datastore.id})`);
        });
        
        // 4. Usar el primer datastore (puedes modificar esto para usar uno específico)
        const selectedDatastore = datastores[0];
        console.log(`\n🎯 Usando datastore: ${selectedDatastore.name} (${selectedDatastore.id})`);
        
        // 5. Subir datos en lotes para evitar problemas de tamaño
        const batchSize = 5;
        const totalBatches = Math.ceil(sampleData.length / batchSize);
        
        console.log(`\n📦 Subiendo datos en ${totalBatches} lotes de ${batchSize} documentos...`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, sampleData.length);
            const batch = sampleData.slice(start, end);
            
            console.log(`\n📤 Lote ${i + 1}/${totalBatches} (documentos ${start + 1}-${end})...`);
            
            const success = await uploadDataToDatastore(selectedDatastore.id, batch);
            
            if (success) {
                successCount += batch.length;
                console.log(`✅ Lote ${i + 1} completado`);
            } else {
                errorCount += batch.length;
                console.log(`❌ Error en lote ${i + 1}`);
            }
        }
        
        // 6. Resumen final
        console.log('\n📊 RESUMEN FINAL:');
        console.log(`   Datastore: ${selectedDatastore.name}`);
        console.log(`   Total de documentos: ${sampleData.length}`);
        console.log(`   Documentos subidos exitosamente: ${successCount}`);
        console.log(`   Documentos con error: ${errorCount}`);
        
        if (successCount > 0) {
            console.log('\n🎉 Carga de datos completada!');
            console.log('✅ Los datos están disponibles en tu datastore de Bravilo');
            console.log('💡 Ahora puedes usar estos datos en tus agentes de IA');
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
    loadSampleData
};
