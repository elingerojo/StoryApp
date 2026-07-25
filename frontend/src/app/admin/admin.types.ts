import type { HistoriaScrollyEntity } from '../../../../backend/src/shared/interfaces';

/**
 * Versión resumida de HistoriaScrollyEntity para el Dashboard.
 * Excluye los campos pesados (json_original, json_modificado) que no se
 * necesitan en la lista principal.
 */
export interface HistoriaResumen {
  id: number;
  slug: string;
  titulo: string;
  estado: string;
  svg_final_url: string | null;
  creado_en: string;
  actualizado_en: string;
}

/**
 * Respuesta del endpoint POST /api/historias/:slug/upload-svg
 */
export interface UploadSvgResponse {
  slug: string;
  svg_final_url: string;
  estado: string;
}

/**
 * Cuerpo para PUT /api/historias/:slug
 * Todos los campos son opcionales: solo se envían los que se desea actualizar.
 */
export interface ActualizarHistoriaPayload {
  json_modificado?: HistoriaScrollyEntity['json_modificado'];
  estado?: string;
  svg_final_url?: string;
}
