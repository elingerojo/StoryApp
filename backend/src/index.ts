import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import storyRouter from './controllers/story.controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware global
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Aumentamos límite para SVGs grandes

// Endpoint de prueba de salud
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'scrolly-backend' });
});

// Endpoints de la API — todas las rutas /api/historias/* se delegan al controller
app.use('/api', storyRouter);

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor MVP corriendo en el puerto ${port}`);
});
