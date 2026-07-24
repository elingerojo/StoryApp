import { db } from './config/database';
import { generarHistoriaConIA } from './services/ai.service';

async function ejecutarPruebaDeIntegracion() {
  const conceptoDePrueba = "Mecanismo de consenso Proof of Work de Bitcoin";
  
  console.log(`🤖 1. Iniciando llamada a Google AI Studio (Gemini 2.5 Flash)...`);
  console.log(`💡 Concepto a procesar: "${conceptoDePrueba}"`);
  
  try {
    // 1. Invocar a Gemini y obtener la salida estructurada
    const jsonDeIA = await generarHistoriaConIA(conceptoDePrueba);
    
    console.log('✅ 2. ¡Respuesta de Gemini recibida con éxito!');
    console.log(`📦 Slug generado por la IA: "${jsonDeIA.storyId}"`);
    console.log(`📝 Título asignado: "${jsonDeIA.title}"`);
    console.log(`📊 Escenas generadas: ${jsonDeIA.scenes.length} pasos.`);
    console.log(`📐 Tamaño del SVG Raw generado: ${jsonDeIA.svg_raw.length} caracteres.`);

    console.log('\n🗄️ 3. Intentando insertar los datos en Neon (PostgreSQL)...');
    
    // 2. Insertar en la tabla que acabamos de crear en Neon
    const query = `
      INSERT INTO historias_scrolly (slug, titulo, json_original, json_modificado)
      VALUES ($1, $2, $3, $3)
      RETURNING id, slug, estado, creado_en;
    `;
    const values = [jsonDeIA.storyId, jsonDeIA.title, jsonDeIA];
    
    const { rows } = await db.query(query, values);
    const registroInsertado = rows[0];

    console.log('🎉 ¡PRUEBA DE INTEGRACIÓN EXITOSA! 🎉');
    console.log('--------------------------------------------------');
    console.log(`🆔 ID en Base de Datos: ${registroInsertado.id}`);
    console.log(`🔗 Slug guardado:       ${registroInsertado.slug}`);
    console.log(`⚙️  Estado del MVP:     ${registroInsertado.estado}`);
    console.log(`📅 Fecha de creación:  ${registroInsertado.creado_en}`);
    console.log('--------------------------------------------------');
    console.log('👉 El registro ya está disponible en Neon en estado IA_RAW para tu edición.');

  } catch (error: any) {
    console.error('\n❌ ERROR EN LA PRUEBA DE INTEGRACIÓN ❌');
    console.error('--------------------------------------------------');
    console.error(`Mensaje: ${error.message}`);
    if (error.stack) {
      console.error(`Detalles del Stack Trace:\n${error.stack}`);
    }
    console.error('--------------------------------------------------');
  } finally {
    // Cerrar el Pool de conexiones de pg de forma limpia para que el script termine de ejecutarse
    await db.end();
    console.log('🔌 Conexión a la base de datos cerrada de forma segura.');
  }
}

// Ejecutar la prueba
ejecutarPruebaDeIntegracion();