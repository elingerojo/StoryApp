import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { generarHistoriaConIA } from '../services/ai.service';
// import { subirSvgABlob } from '../services/blob.service';

const router = Router();

// 1. Disparar Google AI Studio para crear una nueva historia
router.post('/historias/generar', async (req: Request, res: Response) => {
  const { concepto } = req.body; // Ej: "Mecanismo de consenso Proof of Work"
  try {
    const jsonDeIA = await generarHistoriaConIA(concepto);
    
    const query = `
      INSERT INTO historias_scrolly (slug, titulo, json_original, json_modificado)
      VALUES ($1, $2, $3, $3)
      RETURNING *;
    `;
    const values = [jsonDeIA.storyId, jsonDeIA.title, jsonDeIA];
    const { rows } = await db.query(query, values);
    
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error invocando la IA', detalles: error });
  }
});

// 2. Endpoint de Edición Manual (Actualiza textos, escenas o keyframes de GSAP)
router.put('/historias/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { json_modificado, estado } = req.body;
  
  try {
    const query = `
      UPDATE historias_scrolly 
      SET json_modificado = $1, estado = $2, actualizado_en = NOW()
      WHERE slug = $3 RETURNING *;
    `;
    const { rows } = await db.query(query, [json_modificado, estado, slug]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la historia' });
  }
});
/*
// 3. Vincular el SVG pulido en Figma (Subida a Vercel Blobs)
router.post('/historias/:slug/upload-svg', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { svgRawText } = req.body; // Mandamos el código SVG limpio de Figma como string
  
  try {
    // Subir el archivo a Vercel Blobs y obtener su URL CDN
    const blobUrl = await subirSvgABlob(`${slug}.svg`, svgRawText);
    
    const query = `
      UPDATE historias_scrolly 
      SET svg_final_url = $1, estado = 'LISTO_PARA_PRODUCCION'
      WHERE slug = $2 RETURNING *;
    `;
    const { rows } = await db.query(query, [blobUrl, slug]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al subir a Vercel Blobs' });
  }
});
*/
// 4. API de consumo para tu Frontend Angular (Público)
router.get('/historias/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { rows } = await db.query('SELECT * FROM historias_scrolly WHERE slug = $1', [slug]);
  if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

export default router;
