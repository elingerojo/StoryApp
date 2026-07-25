import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { ScrollyStoryComponent } from '../components/scrolly-story.component';

@Component({
  selector: 'app-admin-story-preview',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollyStoryComponent],
  template: `
    <div class="preview-banner">
      <a [routerLink]="['/admin', slug()]" class="back-link">← Volver al editor</a>
      <span>🔍 Modo vista previa</span>
    </div>
    <div *ngIf="loading()" class="state-msg">Cargando...</div>
    <div *ngIf="error()" class="state-msg error">Error al cargar la historia.</div>
    <app-scrolly-story *ngIf="data() as d" [storyData]="d"></app-scrolly-story>
  `,
  styles: [`
    .preview-banner { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 2rem; background: #1e293b; color: #f8fafc; font-size: 0.9rem; }
    .back-link { color: #38bdf8; text-decoration: none; }
    .state-msg { padding: 2rem; text-align: center; color: #64748b; }
    .state-msg.error { color: #dc2626; }
  `]
})
export class AdminStoryPreviewComponent {
  private route = inject(ActivatedRoute);
  private admin = inject(AdminService);

  private slugParam = toSignal(this.route.paramMap.pipe(map(p => p.get('slug'))));
  slug = computed(() => this.slugParam());

  data = signal<any>(null);
  loading = signal(true);
  error = signal(false);

  constructor() {
    effect(() => {
      const slug = this.slug();
      if (!slug) return;
      this.loading.set(true);
      this.admin.obtenerHistoria(slug).subscribe({
        next: (d) => { this.data.set(d); this.loading.set(false); },
        error: () => { this.error.set(true); this.loading.set(false); }
      });
    });
  }
}
