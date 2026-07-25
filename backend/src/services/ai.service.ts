import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';
import { ScrollyStoryJSON } from '../shared/interfaces';

dotenv.config();

// Inicializar el SDK oficial con la API Key de las variables de entorno
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Esquema JSON estricto para que Gemini genere estructuras compatibles con GSAP.
 * 
 * [V1] Ahora soporta:
 * - Múltiples animaciones por escena (animations[])
 * - Offset y duration por animación
 * - Nuevas propiedades: fill, stroke, strokeWidth, strokeDasharray, strokeDashoffset
 * - Compatibilidad legacy: también genera 'animation' singular para datos existentes
 */
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
          // [V1] Array de animaciones — cada escena puede tener múltiples objetivos
          animations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                targetId: { type: Type.STRING },
                offset: { type: Type.NUMBER },
                duration: { type: Type.NUMBER },
                keyframes: {
                  type: Type.OBJECT,
                  properties: {
                    opacity: { type: Type.NUMBER },
                    scale: { type: Type.NUMBER },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    rotation: { type: Type.NUMBER },
                    fill: { type: Type.STRING },
                    stroke: { type: Type.STRING },
                    strokeWidth: { type: Type.NUMBER },
                    strokeDasharray: { type: Type.NUMBER },
                    strokeDashoffset: { type: Type.NUMBER },
                  },
                  // Permite propiedades adicionales sin romper el tipo
                  // (ej: scaleX, scaleY, skewX, borderRadius, etc.)
                },
              },
              required: ['targetId', 'keyframes'],
            },
          },
        },
        required: ['step', 'text', 'animations'],
      },
    },
  },
  required: ['storyId', 'title', 'svg_raw', 'scenes'],
};

export async function generarHistoriaConIA(concepto: string): Promise<ScrollyStoryJSON> {
  const systemInstruction = `
Eres un Ingeniero de Software Senior y Diseñador Visual experto en Scrollytelling. Tu objetivo es explicar conceptos técnicos altamente complejos mediante una secuencia de escenas lógicas vinculadas a animaciones basadas en scroll (GSAP + ScrollTrigger).

## ⚡ REGLA CRÍTICA: MOBILE-FIRST
Los visitantes acceden principalmente desde su teléfono vía QR code. El SVG debe ser LEGIBLE en pantallas de 375px de ancho.

## REGLAS DE DISEÑO DEL SVG (MOBILE-FIRST)

1. Crea un canvas SVG completo (svg_raw) con viewBox="0 0 800 600".
2. Usa un fondo oscuro (ej: #0a0d1a, #080a14, #0f172a) con colores vibrantes.
3. **TAMAÑOS DE FUENTE MÍNIMOS (obligatorio):**
   - Texto principal o títulos: font-size="28" a "36".
   - Etiquetas secundarias: font-size="20" a "24".
   - Subtítulos o detalles: font-size="16" como mínimo ABSOLUTO.
   - NUNCA uses font-size menor a 16 (en viewBox 800x600, eso equivale a ~7px en móvil).
4. **ELEMENTOS GRANDES Y SIMPLES:**
   - Rectángulos: mínimo width="180", height="50".
   - Círculos: mínimo r="25".
   - Reduce la cantidad de elementos: máximo 5-6 elementos principales.
   - NO uses elementos pequeños como círculos decorativos de 6px.
5. **ESPACIADO GENEROSO:**
   - Separa los elementos con al menos 50px de distancia.
   - No apiles elementos verticalmente muy cerca (mínimo 80px entre grupos).
6. Asigna IDs semánticos y explícitos a CADA elemento o grupo (<g>) que pueda ser animado.
7. Define estados INICIALES en los atributos del SVG:
   - opacity="0" para elementos que deben aparecer progresivamente.
   - opacity="0.3" o "0.5" para elementos ya visibles tenuemente.
   - transform="translate(x, y)" para posicionar elementos.
   - fill y stroke con colores iniciales (usa colores hex sólidos, NO gradientes url()).

## REGLAS DE LAS ESCENAS

1. Genera entre 5 y 8 escenas (scenes) secuenciales.
2. Cada escena debe tener el campo 'text' con máximo 2 frases explicativas.
3. El campo 'animations' es un ARRAY — puedes animar MÚLTIPLES elementos en la misma escena.
4. Usa 'offset' para coreografiar las animaciones dentro de la escena:
   - offset: 0 → la animación empieza al inicio de la escena.
   - offset: 0.5 → la animación empieza 0.5s después (mientras otra sigue activa).
5. Usa 'duration' para controlar la velocidad (default: 1).

## PROPIEDADES ANIMABLES DISPONIBLES

Dentro de 'keyframes', puedes usar:
- opacity (0-1): Para aparecer/desaparecer.
- scale (0-5): Para agrandar o encoger.
- x, y (-500 a 500): Para desplazar en píxeles.
- rotation (0-360): Para rotar en grados.
- fill (string hex, ej: '#00ff00'): Para cambiar color de relleno.
- stroke (string hex, ej: '#ff0000'): Para cambiar color de borde.
- strokeWidth (0-20): Para engrosar/adelgazar bordes.
- strokeDasharray (0-500): Para efectos de línea punteada.
- strokeDashoffset (0-500): Para animar el dibujo de líneas.

## ESTRATEGIA DE ANIMACIÓN RECOMENDADA

- Escena 1: Presentar el primer elemento (opacity: 0 → 1).
- Escenas intermedias: Animar el elemento actual mientras introduces el siguiente.
- Puedes tener hasta 3 animaciones en paralelo en una misma escena usando offsets distintos.
- Última escena: Mostrar el sistema completo con todos los elementos visibles y colores de éxito (verdes).

Ejemplo de coreografía en una escena:
  animations: [
    { targetId: "mining-rig", offset: 0, duration: 1, keyframes: { opacity: 1, rotation: 360 } },
    { targetId: "hash-result", offset: 0.3, duration: 0.5, keyframes: { opacity: 1, fill: "#42e695" } },
    { targetId: "blockchain", offset: 0.8, duration: 0.8, keyframes: { strokeWidth: 6, stroke: "#42e695" } }
  ]
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Explicar el siguiente concepto técnico paso a paso, generando un SVG completo con animaciones múltiples por escena: ${concepto}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: scrollytellingSchema,
      },
    });

    const responseText = response.text;
    if (!responseText) throw new Error('La IA devolvió una respuesta vacía.');

    const parsed = JSON.parse(responseText) as ScrollyStoryJSON;

    // Post-procesamiento: asegurar compatibilidad legacy (animation singular)
    for (const scene of parsed.scenes) {
      if (scene.animations && scene.animations.length > 0) {
        // También establecemos 'animation' con la primera animación para compatibilidad
        scene.animation = {
          targetId: scene.animations[0].targetId,
          keyframes: { ...scene.animations[0].keyframes },
        };
      }
    }

    return parsed;
  } catch (error) {
    console.error('Error en el servicio de Google Gen AI:', error);
    throw error;
  }
}
