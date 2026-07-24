import { Injectable, inject } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HistoriaScrollyEntity } from '@shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class StoryService {
  private http = inject(HttpClient);

  // Reemplaza esta URL por el dominio real que te asigne Railway en producción
  private apiUrl = 'http://localhost:3000/api/historias';

  /**
   * Consume una historia de scrollytelling filtrada por su URL (slug)
   * @param slug Identificador único del concepto técnico (ej: 'oauth2-flow')
   * @returns Observable tipado estrictamente con la entidad de Neon
   */
  obtenerHistoriaPorSlug(slug: string): Observable<HistoriaScrollyEntity> {
    return this.http.get<HistoriaScrollyEntity>(`${this.apiUrl}/${slug}`);
  }
}
