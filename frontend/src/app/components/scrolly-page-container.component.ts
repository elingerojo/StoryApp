import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { StoryService } from '../services/story.service';
import { ScrollyStoryComponent } from './scrolly-story.component';
import { HistoriaScrollyEntity } from '../../../../backend/src/shared/interfaces';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-scrolly-page-container',
  standalone: true,
  imports: [CommonModule, ScrollyStoryComponent],
  template: `
    <!-- Pantalla de carga -->
    <div *ngIf="loading()" class="state-screen loading">
      <div class="spinner"></div>
      <p>Descargando estructura del concepto técnico...</p>
    </div>

    <!-- Pantalla de error -->
    <div *ngIf="error()" class="state-screen error">
      <h2>❌ Concepto no encontrado</h2>
      <p>Verifica el slug en la URL o asegúrate de haberlo generado en el backend.</p>
    </div>
    
    <!-- Renderizado del Core Scrollytelling con GSAP -->
    <app-scrolly-story 
      *ngIf="storyData() as data" 
      [storyData]="data">
    </app-scrolly-story>
  `,
  styles: [`
    .state-screen {
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f8f9fa;
      color: #212529;
    }
    .loading p { margin-top: 1rem; font-size: 1.1rem; color: #495057; }
    .error h2 { color: #dc3545; margin-bottom: 0.5rem; }
    
    /* Spinner CSS minimalista */
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-top-color: #0d6efd;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ScrollyPageContainerComponent {
  private route = inject(ActivatedRoute);
  private storyService = inject(StoryService);

  /** Señal reactiva derivada del slug en la URL */
  private slug = toSignal(
    this.route.paramMap.pipe(map(params => params.get('slug'))),
    { initialValue: null }
  );

  /** Estado reactivo del componente */
  protected storyData = signal<HistoriaScrollyEntity | null>(null);
  protected loading = signal(true);
  protected error = signal(false);

  constructor() {
    // Efecto: cada vez que el slug cambia, dispara la carga de datos
    effect(() => {
      const slug = this.slug();
      
      if (!slug) {
        this.loading.set(false);
        this.error.set(true);
        this.storyData.set(null);
        return;
      }

      this.loading.set(true);
      this.error.set(false);

      // Cargar datos de forma asíncrona
      firstValueFrom(this.storyService.obtenerHistoriaPorSlug(slug))
        .then((data) => {
          this.storyData.set(data);
          this.loading.set(false);
        })
        .catch((err) => {
          console.error('Error recuperando los datos del concepto:', err);
          this.error.set(true);
          this.loading.set(false);
        });
    });
  }
}
