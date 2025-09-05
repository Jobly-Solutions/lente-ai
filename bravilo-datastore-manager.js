// ========================================
// BRAVILO DATASTORE MANAGER
// Ejecutar: node bravilo-datastore-manager.js
// ========================================

require('dotenv').config({ path: '.env.local' });

console.log('🔍 BRAVILO DATASTORE MANAGER...\n');

// Configuración de la API de Bravilo
const BRAVILO_API_URL = process.env.BRAVILO_BASE_URL || 'https://app.braviloai.com/api';
const BRAVILO_TOKEN = process.env.BRAVILO_API_KEY;

if (!BRAVILO_TOKEN) {
    console.log('❌ ERROR: BRAVILO_API_KEY no está configurado en .env.local');
    console.log('   Agrega: BRAVILO_API_KEY="tu-token-de-bravilo"');
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
        const responseData = await response.json();

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

// Función para obtener un datastore específico
async function getDatastore(datastoreId) {
    console.log(`🔍 Obteniendo datastore ${datastoreId}...`);
    
    try {
        const datastore = await braviloRequest(`/datastores/${datastoreId}`);
        console.log('✅ Datastore encontrado:');
        console.log(`   ID: ${datastore.id}`);
        console.log(`   Nombre: ${datastore.name}`);
        console.log(`   Tipo: ${datastore.type}`);
        console.log(`   Visibilidad: ${datastore.visibility}`);
        console.log(`   Descripción: ${datastore.description || 'Sin descripción'}`);
        
        return datastore;
    } catch (error) {
        console.log('❌ Error obteniendo datastore:', error.message);
        return null;
    }
}

// Función para actualizar un datastore
async function updateDatastore(datastoreId, updates) {
    console.log(`🔄 Actualizando datastore ${datastoreId}...`);
    
    try {
        const updatedDatastore = await braviloRequest(`/datastores/${datastoreId}`, 'PATCH', updates);
        console.log('✅ Datastore actualizado exitosamente:');
        console.log(`   Nombre: ${updatedDatastore.name}`);
        console.log(`   Descripción: ${updatedDatastore.description}`);
        console.log(`   Tipo: ${updatedDatastore.type}`);
        
        return updatedDatastore;
    } catch (error) {
        console.log('❌ Error actualizando datastore:', error.message);
        return null;
    }
}

// Función para crear un datastore
async function createDatastore(datastoreData) {
    console.log('➕ Creando nuevo datastore...');
    
    try {
        const newDatastore = await braviloRequest('/datastores', 'POST', datastoreData);
        console.log('✅ Datastore creado exitosamente:');
        console.log(`   ID: ${newDatastore.id}`);
        console.log(`   Nombre: ${newDatastore.name}`);
        console.log(`   Tipo: ${newDatastore.type}`);
        
        return newDatastore;
    } catch (error) {
        console.log('❌ Error creando datastore:', error.message);
        return null;
    }
}

// Función para eliminar un datastore
async function deleteDatastore(datastoreId) {
    console.log(`🗑️  Eliminando datastore ${datastoreId}...`);
    
    try {
        await braviloRequest(`/datastores/${datastoreId}`, 'DELETE');
        console.log('✅ Datastore eliminado exitosamente');
        return true;
    } catch (error) {
        console.log('❌ Error eliminando datastore:', error.message);
        return false;
    }
}

// Función para subir datos a un datastore
async function uploadDataToDatastore(datastoreId, data) {
    console.log(`📤 Subiendo datos al datastore ${datastoreId}...`);
    
    try {
        const result = await braviloRequest(`/datastores/${datastoreId}/query`, 'POST', data);
        console.log('✅ Datos subidos exitosamente');
        console.log(`   Resultado: ${JSON.stringify(result, null, 2)}`);
        
        return result;
    } catch (error) {
        console.log('❌ Error subiendo datos:', error.message);
        return null;
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando Bravilo Datastore Manager...\n');
    
    try {
        // 1. Listar datastores existentes
        const datastores = await listDatastores();
        
        if (datastores.length === 0) {
            console.log('📝 No hay datastores existentes. Creando uno nuevo...');
            
            // Crear un datastore de ejemplo
            const newDatastore = await createDatastore({
                name: 'Mi Datastore de Prueba',
                description: 'Datastore creado desde el script de gestión',
                type: 'qdrant',
                visibility: 'private'
            });
            
            if (newDatastore) {
                console.log('✅ Datastore de ejemplo creado');
            }
        } else {
            // 2. Mostrar opciones de gestión
            console.log('\n🎯 OPCIONES DE GESTIÓN:');
            console.log('   1. Ver detalles de un datastore específico');
            console.log('   2. Actualizar un datastore');
            console.log('   3. Crear un nuevo datastore');
            console.log('   4. Eliminar un datastore');
            console.log('   5. Subir datos a un datastore');
            
            // Ejemplo: obtener el primer datastore
            if (datastores.length > 0) {
                const firstDatastore = await getDatastore(datastores[0].id);
                
                if (firstDatastore) {
                    // Ejemplo: actualizar el datastore
                    const updates = {
                        name: `${firstDatastore.name} (Actualizado)`,
                        description: 'Descripción actualizada desde el script'
                    };
                    
                    await updateDatastore(firstDatastore.id, updates);
                }
            }
        }
        
        console.log('\n🎉 Gestión de datastores completada!');
        
    } catch (error) {
        console.error('❌ Error en la gestión de datastores:', error.message);
    }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Error inesperado:', error);
        process.exit(1);
    });
}

// Exportar funciones para uso en otros scripts
module.exports = {
    listDatastores,
    getDatastore,
    updateDatastore,
    createDatastore,
    deleteDatastore,
    uploadDataToDatastore
};
