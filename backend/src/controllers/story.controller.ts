import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { generarHistoriaConIA } from '../services/ai.service';
import { subirSvgABlob } from '../services/upload.service';

const router = Router();

/**
 * ============================================================
 *  ENDPOINTS PÚBLICOS — Consumidos por el Frontend Angular
 * ============================================================
 */

/**
 * GET /api/historias
 * 
 * [MVP]  No existía. Había que hacer SELECT * en Neon Console.
 * [V1]   Endpoint que lista todas las historias. Filtro opcional por estado.
 *         Útil para el Dashboard del Panel Admin.
 * 
 * Query params:
 *   - estado (opcional): 'IA_RAW' | 'EDITANDO_FIGMA' | 'LISTO_PARA_PRODUCCION'
 */
router.get('/historias', async (req: Request, res: Response) => {
  try {
    const { estado } = req.query;
    let query = 'SELECT id, slug, titulo, estado, svg_final_url, creado_en, actualizado_en FROM historias_scrolly';
    const params: string[] = [];

    if (estado && typeof estado === 'string') {
      query += ' WHERE estado = $1';
      params.push(estado);
    }

    query += ' ORDER BY creado_en DESC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al listar historias:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

/**
 * GET /api/historias/:slug
 * 
 * Endpoint público para que Angular consuma el concepto por su slug.
 * Se mantiene idéntico al MVP, solo se movió del index.ts al controller.
 */
router.get('/historias/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  try {
    const query = 'SELECT * FROM historias_scrolly WHERE slug = $1';
    const { rows } = await db.query(query, [slug]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Concepto no encontrado en la base de datos.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al consultar historia por slug:', error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

/**
 * ============================================================
 *  ENDPOINTS DE ADMINISTRACIÓN — Consumidos por el Panel Admin
 * ============================================================
 */

/**
 * POST /api/historias/generar
 * 
 * [MVP]  Invocaba Gemini y guardaba el resultado. Se mantiene igual.
 * [V1]   Se agregó validación más estricta del concepto.
 */
router.post('/historias/generar', async (req: Request, res: Response) => {
  const { concepto } = req.body;

  if (!concepto || typeof concepto !== 'string' || concepto.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "concepto" es requerido y debe ser un texto válido.' });
  }

  try {
    const jsonDeIA = await generarHistoriaConIA(concepto.trim());

    const query = `
      INSERT INTO historias_scrolly (slug, titulo, json_original, json_modificado)
      VALUES ($1, $2, $3, $3)
      RETURNING *;
    `;
    const values = [jsonDeIA.storyId, jsonDeIA.title, jsonDeIA];
    const { rows } = await db.query(query, values);

    console.log(`✅ Historia generada: "${jsonDeIA.title}" (slug: ${jsonDeIA.storyId})`);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error invocando la IA:', error);
    res.status(500).json({ error: 'Error invocando la IA', detalles: error });
  }
});

/**
 * PUT /api/historias/:slug
 * 
 * [MVP]  Ya existía. Permite actualizar json_modificado y estado.
 * [V1]   Se añadió la opción de actualizar también svg_final_url individualmente.
 */
router.put('/historias/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { json_modificado, estado, svg_final_url } = req.body;

  try {
    // Construir SET dinámicamente para aceptar múltiples campos opcionales
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (json_modificado !== undefined) {
      updates.push(`json_modificado = $${paramIndex++}`);
      params.push(json_modificado);
    }
    if (estado !== undefined) {
      updates.push(`estado = $${paramIndex++}`);
      params.push(estado);
    }
    if (svg_final_url !== undefined) {
      updates.push(`svg_final_url = $${paramIndex++}`);
      params.push(svg_final_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar.' });
    }

    params.push(slug);
    const query = `
      UPDATE historias_scrolly 
      SET ${updates.join(', ')}, actualizado_en = NOW()
      WHERE slug = $${paramIndex} RETURNING *;
    `;
    const { rows } = await db.query(query, params);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Historia no encontrada.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al actualizar la historia:', error);
    res.status(500).json({ error: 'Error al actualizar la historia' });
  }
});

/**
 * POST /api/historias/:slug/upload-svg
 * 
 * [MVP]  Endpoint comentado (no funcional). Subir SVG requería ir al dashboard de Vercel manualmente.
 * [V1]   Endpoint activo: recibe el SVG string, lo sube a Vercel Blobs vía API,
 *         guarda la URL en la DB y cambia el estado a LISTO_PARA_PRODUCCION automáticamente.
 * 
 * Body: { "svgRawText": "<svg>...</svg>" }
 */
router.post('/historias/:slug/upload-svg', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { svgRawText } = req.body;

  if (!svgRawText || typeof svgRawText !== 'string') {
    return res.status(400).json({ error: 'El campo "svgRawText" es requerido y debe contener el código SVG.' });
  }

  try {
    // 1. Subir el SVG a Vercel Blobs y obtener su URL pública
    const blobUrl = await subirSvgABlob(`${slug}.svg`, svgRawText);

    // 2. Actualizar la DB: guardar URL y promover a producción
    const query = `
      UPDATE historias_scrolly 
      SET svg_final_url = $1, estado = 'LISTO_PARA_PRODUCCION', actualizado_en = NOW()
      WHERE slug = $2 RETURNING *;
    `;
    const { rows } = await db.query(query, [blobUrl, slug]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Historia no encontrada.' });
    }

    console.log(`✅ SVG subido y asociado a "${slug}": ${blobUrl}`);
    res.json({
      slug: rows[0].slug,
      svg_final_url: rows[0].svg_final_url,
      estado: rows[0].estado
    });
  } catch (error) {
    console.error('Error al subir a Vercel Blobs:', error);
    res.status(500).json({ error: 'Error al subir el SVG a Vercel Blobs' });
  }
});

/**
 * DELETE /api/historias/:slug
 * 
 * [MVP]  No existía. Para eliminar una historia había que hacer DELETE manual en Neon.
 * [V1]   Endpoint para eliminar una historia. El Panel Admin lo usará con confirmación.
 */
router.delete('/historias/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;

  try {
    const query = 'DELETE FROM historias_scrolly WHERE slug = $1 RETURNING id, slug, titulo';
    const { rows } = await db.query(query, [slug]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Historia no encontrada.' });
    }

    console.log(`🗑️ Historia eliminada: "${rows[0].titulo}" (slug: ${slug})`);
    res.json({ message: 'Historia eliminada correctamente', historia: rows[0] });
  } catch (error) {
    console.error('Error al eliminar la historia:', error);
    res.status(500).json({ error: 'Error al eliminar la historia' });
  }
});

export default router;
