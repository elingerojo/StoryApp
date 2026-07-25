import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { HistoriaScrollyEntity } from '../../../../backend/src/shared/interfaces';
import type { HistoriaResumen, UploadSvgResponse, ActualizarHistoriaPayload } from '../admin/admin.types';

/**
 * 🚀 ADMIN SERVICE — Operaciones CRUD completas para el Panel Admin
 * 
 * [MVP]  Cada operación requería herramientas externas: Neon Console, Vercel Dashboard, curl...
 * [V1]   Todo centralizado aquí: el Panel Admin Angular consume este servicio.
 * 
 * 📡 API Base: Misma URL que StoryService (endpoints /api/historias/*)
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);

  // Misma URL base que el StoryService público
  private apiUrl = 'https://storyapp-production-a827.up.railway.app/api/historias';

  // ──────────────────────────────────────────────
  //  DASHBOARD
  // ──────────────────────────────────────────────

  /**
   * GET /api/historias?estado=...
   * 
   * Lista todas las historias con información resumida.
   * Ideal para el Dashboard del Panel Admin.
   * 
   * @param estado Opcional: filtrar por estado ('IA_RAW', 'EDITANDO_FIGMA', 'LISTO_PARA_PRODUCCION')
   */
  listarHistorias(estado?: string): Observable<HistoriaResumen[]> {
    const params = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    return this.http.get<HistoriaResumen[]>(`${this.apiUrl}${params}`);
  }

  // ──────────────────────────────────────────────
  //  DETALLE / EDICIÓN
  // ──────────────────────────────────────────────

  /**
   * GET /api/historias/:slug
   * 
   * Obtiene la historia completa (con json_original, json_modificado, svg_raw)
   * para el editor detallado.
   */
  obtenerHistoria(slug: string): Observable<HistoriaScrollyEntity> {
    return this.http.get<HistoriaScrollyEntity>(`${this.apiUrl}/${slug}`);
  }

  /**
   * PUT /api/historias/:slug
   * 
   * Actualiza los campos de una historia.
   * Solo envía los campos que cambiaron (actualización parcial).
   * 
   * @param slug Slug de la historia a actualizar
   * @param payload Objeto con los campos a modificar
   */
  actualizarHistoria(slug: string, payload: ActualizarHistoriaPayload): Observable<HistoriaScrollyEntity> {
    return this.http.put<HistoriaScrollyEntity>(`${this.apiUrl}/${slug}`, payload);
  }

  /**
   * PUT /api/historias/:slug (solo estado)
   * 
   * Atajo para cambiar el estado de una historia sin tener que construir el payload manualmente.
   */
  cambiarEstado(slug: string, nuevoEstado: string): Observable<HistoriaScrollyEntity> {
    return this.actualizarHistoria(slug, { estado: nuevoEstado });
  }

  // ──────────────────────────────────────────────
  //  GENERACIÓN CON IA
  // ──────────────────────────────────────────────

  /**
   * POST /api/historias/generar
   * 
   * Invoca a Gemini IA para generar una nueva historia de scrollytelling.
   * 
   * @param concepto Texto del concepto técnico a explicar (ej: "Proof of Stake")
   */
  generarHistoria(concepto: string): Observable<HistoriaScrollyEntity> {
    return this.http.post<HistoriaScrollyEntity>(`${this.apiUrl}/generar`, { concepto });
  }

  // ──────────────────────────────────────────────
  //  SVG / ASSETS
  // ──────────────────────────────────────────────

  /**
   * POST /api/historias/:slug/upload-svg
   * 
   * [MVP]  Subir SVG: Dashboard Vercel manual → arrastrar archivo → copiar URL
   * [V1]   Un click: pegar código SVG → upload automático → URL guardada en DB
   * 
   * @param slug Slug de la historia
   * @param svgRawText Código SVG completo como string (desde Figma o editor)
   */
  subirSvg(slug: string, svgRawText: string): Observable<UploadSvgResponse> {
    return this.http.post<UploadSvgResponse>(`${this.apiUrl}/${slug}/upload-svg`, { svgRawText });
  }

  // ──────────────────────────────────────────────
  //  ELIMINACIÓN
  // ──────────────────────────────────────────────

  /**
   * DELETE /api/historias/:slug
   * 
   * Elimina una historia y todos sus datos de la base de datos.
   * 
   * @param slug Slug de la historia a eliminar
   */
  eliminarHistoria(slug: string): Observable<{ message: string; historia: { id: number; slug: string; titulo: string } }> {
    return this.http.delete<{ message: string; historia: { id: number; slug: string; titulo: string } }>(
      `${this.apiUrl}/${slug}`
    );
  }
}
