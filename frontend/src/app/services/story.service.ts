import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { HistoriaScrollyEntity } from '../../../../backend/src/shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private http = inject(HttpClient);

  // Reemplaza esta URL por el dominio real que te asigne Railway en producción
  private apiUrl = 'https://storyapp-production-a827.up.railway.app/api/historias';

  /**
   * Consume una historia de scrollytelling filtrada por su URL (slug)
   * @param slug Identificador único del concepto técnico (ej: 'oauth2-flow')
   * @returns Observable tipado estrictamente con la entidad de Neon
   */
  obtenerHistoriaPorSlug(slug: string): Observable<HistoriaScrollyEntity> {
    return this.http.get<HistoriaScrollyEntity>(`${this.apiUrl}/${slug}`);
  }
}
