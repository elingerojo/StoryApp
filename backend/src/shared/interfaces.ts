/**
 * Estructura de los Keyframes de animación compatibles con GSAP
 */
export interface GSAPKeyframes {
  opacity?: number;
  scale?: number;
  x?: number;
  y?: number;
  rotation?: number;
  fill?: string;          // Color de relleno (ej: '#00ff00')
  stroke?: string;        // Color de borde (ej: '#ff0000')
  strokeWidth?: number;   // Grosor de borde (ej: 5)
  strokeDasharray?: number; // Patrón de guiones para efecto "dibujar" (ej: 200)
  strokeDashoffset?: number; // Desplazamiento del patrón (ej: 100)
  [key: string]: any;    // Permite expandir propiedades en el futuro sin romper el tipo
}

/**
 * Representa la animación de GSAP vinculada a un ID del SVG
 */
export interface ScrollyAnimation {
  targetId: string;       // Ej: '#nodo-validador'
  keyframes: GSAPKeyframes;
  offset?: number;        // Posición en la timeline (0 = inicio de la escena)
  duration?: number;      // Duración específica (default: 1)
}

/**
 * Cada uno de los pasos o diapositivas activadas por el Scroll
 */
export interface ScrollyScene {
  step: number;           // Orden cronológico (1, 2, 3...)
  text: string;           // Explicación técnica corta expuesta al usuario
  animation?: ScrollyAnimation;    // [LEGACY] Para compatibilidad con datos viejos
  animations?: ScrollyAnimation[]; // [V1] Múltiples animaciones por escena
}

/**
 * El contrato de datos completo generado por Gemini y guardado en Neon
 */
export interface ScrollyStoryJSON {
  storyId: string;        // Slug único (ej: 'oauth2-flow')
  title: string;          // Título legible de la historia
  svg_raw: string;        // Código SVG crudo inicial que entrega la IA
  scenes: ScrollyScene[];
}

/**
 * Enumeración de los estados del ciclo de vida de un concepto en el MVP
 */
export type PasoFlujoMVP = 'IA_RAW' | 'EDITANDO_FIGMA' | 'LISTO_PARA_PRODUCCION';

/**
 * Representación exacta de una fila dentro de la tabla de Neon (PostgreSQL)
 */
export interface HistoriaScrollyEntity {
  id: number;
  slug: string;
  titulo: string;
  estado: PasoFlujoMVP;
  json_original: ScrollyStoryJSON;
  json_modificado: ScrollyStoryJSON; // Esta es la estructura que consumirá el frontend final
  svg_final_url: string | null;      // URL de Vercel Blobs apuntando al SVG limpio de Figma
  creado_en: Date;
  actualizado_en: Date;
}
