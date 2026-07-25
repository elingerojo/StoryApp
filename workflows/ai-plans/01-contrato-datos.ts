/**
 * ESTADO DEL MONOREPO: "storyapp" (Workspaces de npm nativos para Backend y Frontend)
 * UBICACIÓN DEL ARCHIVO COMPARTIDO: backend/src/shared/interfaces.ts
 * (Importado de forma relativa por el Frontend de Angular)
 */

export interface GSAPKeyframes {
  opacity?: number;
  scale?: number;
  x?: number;
  y?: number;
  rotation?: number;
  [key: string]: any;
}

export interface ScrollyAnimation {
  targetId: string; // Ej: 'mempool' (Gemini omite el '#' nativamente)
  keyframes: GSAPKeyframes;
}

export interface ScrollyScene {
  step: number;
  text: string;
  animation: ScrollyAnimation;
}

export interface ScrollyStoryJSON {
  storyId: string;
  title: string;
  svg_raw: string; // Contiene el marcado SVG completo con atributos id="mempool", etc.
  scenes: ScrollyScene[];
}

export type PasoFlujoMVP = 'IA_RAW' | 'EDITANDO_FIGMA' | 'LISTO_PARA_PRODUCCION';

export interface HistoriaScrollyEntity {
  id: number;
  slug: string;
  titulo: string;
  estado: PasoFlujoMVP;
  json_original: ScrollyStoryJSON;
  json_modificado: ScrollyStoryJSON; // Consumido por el Frontend
  svg_final_url: string | null;      // URL de Vercel Blobs
  creado_en: Date;
  actualizado_en: Date;
}