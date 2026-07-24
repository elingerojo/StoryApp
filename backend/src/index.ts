import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/database';
import { generarHistoriaConIA } from './services/ai.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint de prueba de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'scrolly-backend' });
});

// Endpoint principal: Invoca a Gemini y almacena el resultado crudo en Neon
app.post('/api/historias/generar', async (req, res) => {
  const { concepto } = req.body;
  
  if (!concepto) {
    return res.status(400).json({ error: 'El campo "concepto" es requerido.' });
  }

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
  } catch (error: any) {
    res.status(500).json({ error: 'Error procesando la solicitud', detalles: error.message });
  }
});

// Endpoint público para que Angular consuma el concepto por su slug
app.get('/api/historias/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const query = 'SELECT * FROM historias_scrolly WHERE slug = $1';
    const { rows } = await db.query(query, [slug]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Concepto no encontrado en la base de datos.' });
    }
    
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al consultar la base de datos', detalles: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor MVP corriendo en el puerto ${port}`);
});
