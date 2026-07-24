import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';
import { ScrollyStoryJSON } from '@shared/interfaces';
// debugging @shared outside /backend folder

dotenv.config();

// Inicializar el SDK oficial con la API Key de las variables de entorno
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Definición estricta del esquema JSON esperado usando los enums del SDK
const scrollytellingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    storyId: { type: Type.STRING },
    title: { type: Type.STRING },
    svg_raw: { type: Type.STRING },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.INTEGER },
          text: { type: Type.STRING },
          animation: {
            type: Type.OBJECT,
            properties: {
              targetId: { type: Type.STRING },
              keyframes: {
                type: Type.OBJECT,
                properties: {
                  opacity: { type: Type.NUMBER },
                  scale: { type: Type.NUMBER },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER }
                }
              }
            },
            required: ['targetId', 'keyframes']
          }
        },
        required: ['step', 'text', 'animation']
      }
    }
  },
  required: ['storyId', 'title', 'svg_raw', 'scenes']
};

export async function generarHistoriaConIA(concepto: string): Promise<ScrollyStoryJSON> {
  const systemInstruction = `
    Eres un Ingeniero de Software Senior y Diseñador Visual experto en Scrollytelling. Tu objetivo es explicar conceptos técnicos altamente complejos mediante una secuencia de escenas lógicas vinculadas a animaciones basadas en scroll (GSAP / ScrollTrigger).
    
    Debes estructurar la explicación en un canvas visual SVG completo (svg_raw) con viewBox="0 0 800 600". Asigna IDs semánticos y explícitos a cada elemento o grupo (<g>) que vaya a ser animado.
    
    Divide la explicación técnica en un mínimo de 5 y un máximo de 8 pasos cronológicos secuenciales (scenes). El campo 'text' debe ser corto (máximo 2 frases). El campo 'keyframes' dentro de 'animation' debe contener el estado visual final relativo al ID asignado en el SVG.
  `;

  try {
    // Llamada oficial usando la API estructurada de Gemini 2.5
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Explicar el siguiente concepto técnico paso a paso: ${concepto}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: scrollytellingSchema
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error('La IA devolvió una respuesta vacía.');

    // Al usar responseSchema, garantizamos que el JSON es válido y parseable directamente
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error en el servicio de Google Gen AI:', error);
    throw error;
  }
}
