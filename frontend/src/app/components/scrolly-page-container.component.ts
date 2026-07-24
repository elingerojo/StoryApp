import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common/common';
import { ScrollyStoryComponent } from './scrolly-story.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-scrolly-page-container',
  standalone: true,
  imports: [CommonModule, ScrollyStoryComponent],
  template: `
    <div *ngIf="loading" class="loading-screen">Cargando concepto técnico...</div>
    <div *ngIf="error" class="error-screen">No se pudo cargar la historia. Verifica la URL.</div>
    
    <!-- Cuando los datos de Neon están listos, renderizamos el scrollytelling -->
    <app-scrolly-story *ngIf="storyData" [storyData]="storyData"></app-scrolly-story>
  `,
  styles: [`
    .loading-screen, .error-screen { 
      height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; font-size: 1.2rem; 
    }
  `]
})
export class ScrollyPageContainerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  storyData: any = null;
  loading = true;
  error = false;

  // Cambia esto por tu URL real de Railway en producción
  private apiUrl = 'https://railway.app';

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const slug = params.get('slug');
      if (slug) {
        await this.cargarHistoria(slug);
      }
    });
  }

  async cargarHistoria(slug: string) {
    this.loading = true;
    this.error = false;
    try {
      // Consumimos el endpoint simplificado de Railway que lee de Neon
      this.storyData = await firstValueFrom(this.http.get<any>(`${this.apiUrl}/${slug}`));
    } catch (err) {
      console.error(err);
      this.error = true;
    } finally {
      this.loading = false;
    }
  }
}
