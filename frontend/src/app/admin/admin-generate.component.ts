import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-generate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-layout">
      <header class="admin-header">
        <a routerLink="/admin" class="back-link">← Volver al panel</a>
        <h1>🧠 Generar nueva historia con IA</h1>
      </header>

      <div class="card">
        <p class="desc">Ingresa un concepto técnico complejo. Gemini IA generará automáticamente las escenas, textos, animaciones y un SVG preliminar.</p>

        <div class="form-group">
          <label for="concepto">Concepto técnico</label>
          <textarea id="concepto"
                    [(ngModel)]="concepto"
                    placeholder="Ej: Mecanismo de consenso Proof of Stake"
                    rows="3"
                    [disabled]="generando()"></textarea>
        </div>

        <div class="suggestions">
          <span class="hint">Sugerencias rápidas:</span>
          <button *ngFor="let sug of sugerencias" 
                  class="chip" 
                  (click)="concepto.set(sug)"
                  [disabled]="generando()">
            {{ sug }}
          </button>
        </div>

        <button class="btn-generar" 
                (click)="generar()" 
                [disabled]="generando() || !concepto().trim()">
          {{ generando() ? '⏳ Generando...' : '🚀 Generar con Gemini' }}
        </button>

        <!-- Éxito -->
        <div *ngIf="exito()" class="alert success">
          ✅ Historia "{{ exito() }}" creada exitosamente.
          <a [routerLink]="['/admin', slugCreado()]" class="btn-sm">✏️ Editar ahora</a>
        </div>

        <!-- Error -->
        <div *ngIf="errorMsg()" class="alert error">
          ❌ {{ errorMsg() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout { max-width: 800px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif; }
    .admin-header { margin-bottom: 1.5rem; }
    .admin-header h1 { margin: 0.5rem 0 0; font-size: 1.4rem; color: #0f172a; }
    .back-link { color: #0d6efd; text-decoration: none; font-size: 0.9rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; }
    .desc { color: #475569; margin-top: 0; margin-bottom: 1.5rem; line-height: 1.5; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: 0.4rem; color: #0f172a; }
    textarea { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; resize: vertical; box-sizing: border-box; }
    textarea:focus { outline: none; border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); }
    .suggestions { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; margin-bottom: 1.5rem; }
    .hint { font-size: 0.8rem; color: #64748b; }
    .chip { padding: 0.3rem 0.8rem; border-radius: 16px; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; font-size: 0.8rem; color: #334155; }
    .chip:hover { background: #e2e8f0; }
    .btn-generar { background: #0d6efd; color: white; border: none; padding: 0.8rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%; }
    .btn-generar:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-generar:hover:not(:disabled) { background: #0b5ed7; }
    .alert { margin-top: 1rem; padding: 1rem; border-radius: 8px; display: flex; align-items: center; gap: 0.8rem; }
    .alert.success { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
    .alert.error { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
    .btn-sm { padding: 0.25rem 0.6rem; border-radius: 6px; text-decoration: none; font-size: 0.8rem; background: #16a34a; color: white; margin-left: auto; }
  `]
})
export class AdminGenerateComponent {
  private admin = inject(AdminService);
  private router = inject(Router);

  concepto = signal('');
  generando = signal(false);
  exito = signal<string | null>(null);
  slugCreado = signal<string | null>(null);
  errorMsg = signal<string | null>(null);

  sugerencias = [
    'Mecanismo de consenso Proof of Stake',
    'Flujo OAuth2.0',
    'Intercambio de llaves Diffie-Hellman',
    'Arquitectura de microservicios',
  ];

  generar() {
    const texto = this.concepto().trim();
    if (!texto) return;

    this.generando.set(true);
    this.exito.set(null);
    this.errorMsg.set(null);

    this.admin.generarHistoria(texto).subscribe({
      next: (res) => {
        this.generando.set(false);
        this.exito.set(res.titulo);
        this.slugCreado.set(res.slug);
      },
      error: (err) => {
        this.generando.set(false);
        this.errorMsg.set(err.error?.error || 'Error al comunicarse con el backend.');
      }
    });
  }
}
