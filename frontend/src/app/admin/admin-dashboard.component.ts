import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../services/admin.service';
import type { HistoriaResumen } from './admin.types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-layout">
      <header class="admin-header">
        <h1>📊 Panel de Control</h1>
        <a routerLink="/admin/generar" class="btn-primary">+ Generar nueva historia</a>
      </header>

      <!-- Filtro por estado -->
      <div class="filter-tabs">
        <button *ngFor="let tab of tabs" 
                class="tab" 
                [class.active]="filtroEstado() === tab.valor"
                (click)="filtroEstado.set(tab.valor)">
          {{ tab.label }}
        </button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="state-msg">Cargando historias...</div>

      <!-- Error -->
      <div *ngIf="error()" class="state-msg error">
        Error al cargar las historias. Verifica que el backend esté corriendo.
      </div>

      <!-- Tabla -->
      <div *ngIf="!loading() && !error() && historias() as hList" class="table-container">
        <table *ngIf="hList.length > 0; else empty">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Título</th>
              <th>Estado</th>
              <th>SVG</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let h of hList">
              <td><code>{{ h.slug }}</code></td>
              <td>{{ h.titulo }}</td>
              <td><span class="badge" [class]="h.estado">{{ h.estado }}</span></td>
              <td>{{ h.svg_final_url ? '✅' : '⏳' }}</td>
              <td>{{ h.creado_en | date:'short' }}</td>
              <td class="actions">
                <a [routerLink]="['/admin', h.slug]" class="btn-sm">✏️ Editar</a>
                <a [routerLink]="['/', h.slug]" target="_blank" class="btn-sm">👁️ Ver</a>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <div class="state-msg">No hay historias con este estado.</div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout { max-width: 1200px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif; }
    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .admin-header h1 { margin: 0; font-size: 1.5rem; color: #0f172a; }
    .btn-primary { background: #0d6efd; color: white; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
    .btn-primary:hover { background: #0b5ed7; }
    .filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .tab { padding: 0.4rem 1rem; border-radius: 20px; border: 1px solid #dee2e6; background: white; cursor: pointer; font-size: 0.85rem; }
    .tab.active { background: #0d6efd; color: white; border-color: #0d6efd; }
    .table-container { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 0.8rem; text-transform: uppercase; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .IA_RAW { background: #fee2e2; color: #dc2626; }
    .EDITANDO_FIGMA { background: #fef9c3; color: #a16207; }
    .LISTO_PARA_PRODUCCION { background: #dcfce7; color: #16a34a; }
    .actions { display: flex; gap: 0.4rem; }
    .btn-sm { padding: 0.25rem 0.6rem; border-radius: 6px; text-decoration: none; font-size: 0.8rem; background: #f1f5f9; color: #334155; }
    .btn-sm:hover { background: #e2e8f0; }
    .state-msg { padding: 2rem; text-align: center; color: #64748b; }
    .state-msg.error { color: #dc2626; }
    code { background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }
  `]
})
export class AdminDashboardComponent {
  private admin = inject(AdminService);

  /** Señal reactiva para el filtro de estado */
  filtroEstado = signal<string | undefined>(undefined);

  /** Opciones del filtro */
  tabs = [
    { label: '📋 Todas', valor: undefined },
    { label: '🤖 IA_RAW', valor: 'IA_RAW' },
    { label: '🎨 EDITANDO_FIGMA', valor: 'EDITANDO_FIGMA' },
    { label: '✅ LISTO_PARA_PRODUCCION', valor: 'LISTO_PARA_PRODUCCION' },
  ];

  /** Estado reactivo */
  historias = signal<HistoriaResumen[]>([]);
  loading = signal(true);
  error = signal(false);

  constructor() {
    // Efecto: recargar cuando cambia el filtro
    effect(() => {
      const estado = this.filtroEstado();
      this.loading.set(true);
      this.error.set(false);

      this.admin.listarHistorias(estado).subscribe({
        next: (data) => {
          this.historias.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
    });
  }
}
