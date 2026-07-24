import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { StoryService } from '../services/story.service';
import { ScrollyStoryComponent } from './scrolly-story.component';
import { HistoriaScrollyEntity } from '@shared/interfaces';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-scrolly-page-container',
  standalone: true,
  imports: [CommonModule, ScrollyStoryComponent],
  template: `
    <!-- Pantalla de carga -->
    <div *ngIf="loading" class="state-screen loading">
      <div class="spinner"></div>
      <p>Descargando estructura del concepto técnico...</p>
    </div>

    <!-- Pantalla de error -->
    <div *ngIf="error" class="state-screen error">
      <h2>❌ Concepto no encontrado</h2>
      <p>Verifica el slug en la URL o asegúrate de haberlo generado en el backend.</p>
    </div>
    
    <!-- Renderizado del Core Scrollytelling con GSAP -->
    <app-scrolly-story 
      *ngIf="!loading && !error && storyData" 
      [storyData]="storyData">
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
export class ScrollyPageContainerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private storyService = inject(StoryService);

  storyData: HistoriaScrollyEntity | null = null;
  loading = true;
  error = false;

  async ngOnInit() {
    // Escuchar cambios en la URL de forma reactiva por si el usuario navega entre historias
    this.route.paramMap.subscribe(async (params) => {
      const slug = params.get('slug');
      if (slug) {
        await this.cargarDatosDeHistoria(slug);
      } else {
        this.loading = false;
        this.error = true;
      }
    });
  }

  private async cargarDatosDeHistoria(slug: string) {
    this.loading = true;
    this.error = false;
    try {
      // Convertimos el observable a promesa para un manejo asíncrono limpio con try/catch
      this.storyData = await firstValueFrom(this.storyService.obtenerHistoriaPorSlug(slug));
    } catch (err) {
      console.error('Error recuperando los datos del concepto:', err);
      this.error = true;
    } finally {
      this.loading = false;
    }
  }
}