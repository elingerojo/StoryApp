import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { SvgInlineDirective } from '../directives/svg-inline.directive';
import type { HistoriaScrollyEntity, ScrollyScene, ScrollyAnimation, ScrollyStoryJSON } from '../../../../backend/src/shared/interfaces';

@Component({
  selector: 'app-admin-story-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SvgInlineDirective],
  template: `
    <div class="admin-layout">
      <header class="admin-header">
        <a routerLink="/admin" class="back-link">← Panel</a>
        <h1 *ngIf="data() as d">✏️ {{ d.titulo }}</h1>
        <div class="header-actions">
          <a *ngIf="slug()" [routerLink]="['/admin', slug(), 'preview']" class="btn-outline">👁️ Vista previa</a>
        </div>
      </header>

      <div *ngIf="loading()" class="state-msg">Cargando historia...</div>
      <div *ngIf="error()" class="state-msg error">Error al cargar la historia.</div>

      <ng-container *ngIf="data() as d">
        <!-- ═══════════ METADATOS ═══════════ -->
        <section class="card">
          <h2>📋 Metadatos</h2>
          <div class="meta-grid">
            <div><label>Slug</label><code>{{ d.slug }}</code></div>
            <div><label>Título</label><input [(ngModel)]="titulo" class="input" /></div>
            <div>
              <label>Estado</label>
              <div class="estado-row">
                <span class="badge" [class]="d.estado">{{ d.estado }}</span>
                <button class="btn-sm" (click)="promoverEstado()" [disabled]="d.estado === 'LISTO_PARA_PRODUCCION'">▶ Promover</button>
              </div>
            </div>
            <div><label>SVG Final</label><span *ngIf="d.svg_final_url; else noSvg">✅ Subido</span><ng-template #noSvg>⏳ Pendiente</ng-template></div>
          </div>
        </section>

        <!-- ═══════════ SVG ═══════════ -->
        <section class="card">
          <h2>🖼️ SVG</h2>
          <div class="svg-preview" [appSvgInline]="fuenteSvgPreview()"></div>
          <div class="svg-actions">
            <button class="btn-sm" (click)="copiarSvgRaw()">📋 Copiar SVG raw</button>
            <span class="hint">Pega en Figma, refina, luego pega el resultado abajo:</span>
            <textarea [(ngModel)]="svgPulido" rows="4" placeholder="Pega aquí el SVG refinado desde Figma..."></textarea>
            <button class="btn-primary" (click)="subirSvg()" [disabled]="!svgPulido.trim() || subiendo()">{{ subiendo() ? '⏳ Subiendo...' : '☁️ Subir a Vercel Blobs' }}</button>
            <div *ngIf="uploadOk()" class="alert success">✅ SVG subido exitosamente</div>
          </div>
        </section>

        <!-- ═══════════ ESCENAS ═══════════ -->
        <section class="card" *ngIf="escenas.length">
          <h2>🎬 Escenas ({{ escenas.length }})</h2>
          <p class="hint">🐛 DEBUG: scenes[0].animations = {{ escenas[0].animations?.length ?? 'ninguno (usando legacy animation)' }} animaciones</p>

          <div *ngFor="let escena of escenas; trackBy: trackByStep; let i = index" class="scene-card">
            <div class="scene-header">
              <span class="step-badge">Paso {{ escena.step }}</span>
              <span class="anim-count">{{ (escena.animations || []).length }} animación(es)</span>
            </div>
            <div class="scene-body">
              <div class="field">
                <label>Texto explicativo</label>
                <textarea [(ngModel)]="escenas[i].text" rows="2" class="input" [ngModelOptions]="{standalone: true}"></textarea>
              </div>

              <!-- Múltiples animaciones por escena -->
              <div class="anim-section-label">Animaciones:</div>
              <div *ngFor="let anim of (escena.animations || []); let a = index" class="anim-card">
                <div class="anim-card-header">
                  <span>🎯 Animación #{{ a + 1 }}</span>
                  <button class="btn-sm btn-danger-sm" (click)="eliminarAnimacion(i, a)" *ngIf="(escena.animations || []).length > 1">✕</button>
                </div>

                <div class="anim-fields">
                  <div class="field-row">
                    <div class="field half">
                      <label>Target ID</label>
                      <input [(ngModel)]="escenas[i].animations![a].targetId" class="input" placeholder="Ej: mempool" [ngModelOptions]="{standalone: true}" />
                    </div>
                    <div class="field half">
                      <label>Offset (posición en timeline)</label>
                      <div class="range-row">
                        <input type="range" min="0" max="5" step="0.1" [(ngModel)]="escenas[i].animations![a].offset" [ngModelOptions]="{standalone: true}" />
                        <span class="val">{{ escenas[i].animations![a].offset ?? 0 }}s</span>
                      </div>
                    </div>
                    <div class="field half">
                      <label>Duración</label>
                      <div class="range-row">
                        <input type="range" min="0.2" max="5" step="0.1" [(ngModel)]="escenas[i].animations![a].duration" [ngModelOptions]="{standalone: true}" />
                        <span class="val">{{ escenas[i].animations![a].duration ?? 1 }}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="keyframes-grid">
                  <!-- Propiedades existentes -->
                  <div class="kf-item">
                    <label>Opacidad <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'opacity') }}</span></label>
                    <div class="range-row">
                      <input type="range" min="0" max="1" step="0.1" [(ngModel)]="escenas[i].animations![a].keyframes.opacity" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.opacity }}</span>
                    </div>
                  </div>
                  <div class="kf-item">
                    <label>Escala <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'scale') }}</span></label>
                    <div class="range-row">
                      <input type="range" min="0" max="5" step="0.1" [(ngModel)]="escenas[i].animations![a].keyframes.scale" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.scale }}</span>
                    </div>
                  </div>
                  <div class="kf-item">
                    <label>X <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'x') }}</span></label>
                    <div class="range-row">
                      <input type="range" min="-500" max="500" step="10" [(ngModel)]="escenas[i].animations![a].keyframes.x" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.x }}</span>
                    </div>
                  </div>
                  <div class="kf-item">
                    <label>Y <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'y') }}</span></label>
                    <div class="range-row">
                      <input type="range" min="-500" max="500" step="10" [(ngModel)]="escenas[i].animations![a].keyframes.y" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.y }}</span>
                    </div>
                  </div>
                  <div class="kf-item">
                    <label>Rotación <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'rotation') }}</span></label>
                    <div class="range-row">
                      <input type="range" min="0" max="360" step="5" [(ngModel)]="escenas[i].animations![a].keyframes.rotation" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.rotation }}</span>
                    </div>
                  </div>

                  <!-- NUEVAS propiedades -->
                  <div class="kf-item">
                    <label>🎨 Fill <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'fill') }}</span></label>
                    <div class="color-row">
                      <input type="color" [(ngModel)]="escenas[i].animations![a].keyframes.fill" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.fill }}</span>
                    </div>
                  </div>
                  <div class="kf-item">
                    <label>🎨 Stroke <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'stroke') }}</span></label>
                    <div class="color-row">
                      <input type="color" [(ngModel)]="escenas[i].animations![a].keyframes.stroke" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.stroke }}</span>
                    </div>
                  </div>
                  <div class="kf-item">
                    <label>StrokeWidth <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'strokeWidth') }}</span></label>
                    <div class="range-row">
                      <input type="range" min="0" max="20" step="1" [(ngModel)]="escenas[i].animations![a].keyframes.strokeWidth" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.strokeWidth }}</span>
                    </div>
                  </div>
                  <div class="kf-item">
                    <label>Dasharray <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'strokeDasharray') }}</span></label>
                    <div class="range-row">
                      <input type="range" min="0" max="500" step="5" [(ngModel)]="escenas[i].animations![a].keyframes.strokeDasharray" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.strokeDasharray }}</span>
                    </div>
                  </div>
                  <div class="kf-item">
                    <label>Dashoffset <span class="init-val">◀ {{ valorInicialSVG(d, escenas[i].animations![a].targetId, 'strokeDashoffset') }}</span></label>
                    <div class="range-row">
                      <input type="range" min="0" max="500" step="5" [(ngModel)]="escenas[i].animations![a].keyframes.strokeDashoffset" [ngModelOptions]="{standalone: true}" />
                      <span class="val">{{ escenas[i].animations![a].keyframes.strokeDashoffset }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button class="btn-sm" (click)="agregarAnimacion(i)" style="margin-top:0.5rem;">+ Añadir otra animación</button>
            </div>
          </div>

          <div class="save-bar">
            <button class="btn-primary" (click)="guardar()" [disabled]="guardando()">{{ guardando() ? '⏳ Guardando...' : '💾 Guardar cambios' }}</button>
            <span *ngIf="saveOk()" class="alert success" style="display:inline-block; margin:0; padding:0.4rem 1rem;">✅ Guardado</span>
          </div>
        </section>

        <!-- ═══════════ ZONA DE PELIGRO ═══════════ -->
        <section class="card danger-zone">
          <h2>🗑️ Zona de peligro</h2>
          <p class="hint">Esta acción eliminará permanentemente la historia.</p>
          <button class="btn-danger" (click)="eliminar()" [disabled]="eliminando()">{{ eliminando() ? '⏳ Eliminando...' : '🗑️ Eliminar esta historia' }}</button>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .admin-layout { max-width: 1100px; margin: 0 auto; padding: 2rem; font-family: system-ui, sans-serif; }
    .admin-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .admin-header h1 { margin: 0; font-size: 1.4rem; color: #0f172a; flex: 1; }
    .back-link { color: #0d6efd; text-decoration: none; font-size: 0.9rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .card h2 { margin: 0 0 1rem; font-size: 1.1rem; color: #0f172a; }
    .danger-zone { border-color: #fecaca; }
    .danger-zone h2 { color: #dc2626; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .meta-grid label { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem; font-weight: 600; }
    .input { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box; }
    .input:focus { outline: none; border-color: #0d6efd; box-shadow: 0 0 0 3px rgba(13,110,253,0.1); }
    .badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .IA_RAW { background: #fee2e2; color: #dc2626; }
    .EDITANDO_FIGMA { background: #fef9c3; color: #a16207; }
    .LISTO_PARA_PRODUCCION { background: #dcfce7; color: #16a34a; }
    .estado-row { display: flex; align-items: center; gap: 0.5rem; }
    .btn-outline { padding: 0.4rem 1rem; border-radius: 8px; border: 1px solid #cbd5e1; text-decoration: none; font-size: 0.85rem; color: #334155; }
    .btn-outline:hover { background: #f8fafc; }
    .btn-sm { padding: 0.3rem 0.8rem; border-radius: 6px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-size: 0.8rem; }
    .btn-sm:hover { background: #f1f5f9; }
    .btn-primary { background: #0d6efd; color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-primary:hover:not(:disabled) { background: #0b5ed7; }
    .btn-danger { background: #dc2626; color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
    .btn-danger:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-danger-sm { color: #dc2626; border-color: #fecaca; padding: 0.2rem 0.5rem; font-size: 0.75rem; }
    .svg-preview { background: #0f172a; border-radius: 8px; min-height: 180px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; padding: 1rem; }
    ::v-deep .svg-preview svg { max-width: 100%; max-height: 280px; }
    .svg-actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .svg-actions textarea { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem; font-family: monospace; box-sizing: border-box; }
    .hint { font-size: 0.8rem; color: #64748b; }
    .scene-card { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 1rem; overflow: hidden; }
    .scene-header { background: #f8fafc; padding: 0.5rem 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .step-badge { font-size: 0.75rem; font-weight: 700; color: #0d6efd; text-transform: uppercase; }
    .anim-count { font-size: 0.75rem; color: #64748b; }
    .scene-body { padding: 1rem; }
    .field { margin-bottom: 0.8rem; }
    .field label { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem; font-weight: 600; }
    .field-row { display: flex; gap: 1rem; flex-wrap: wrap; }
    .field.half { flex: 1; min-width: 200px; }
    .anim-section-label { font-size: 0.85rem; font-weight: 600; color: #0f172a; margin: 0.8rem 0 0.5rem; padding-top: 0.8rem; border-top: 1px dashed #e2e8f0; }
    .anim-card { background: #fafbfc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.8rem; margin-bottom: 0.5rem; }
    .anim-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #334155; }
    .anim-fields { margin-bottom: 0.5rem; }
    .range-row { display: flex; align-items: center; gap: 0.4rem; }
    .range-row input[type="range"] { flex: 1; min-width: 0; height: 1.2rem; }
    .color-row { display: flex; align-items: center; gap: 0.5rem; }
    .color-row input[type="color"] { width: 40px; height: 30px; padding: 0; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; }
    .keyframes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.6rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9; }
    .kf-item label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.2rem; }
    .kf-item .val { font-size: 0.8rem; color: #0f172a; font-weight: 600; min-width: 2rem; text-align: right; }
    .init-val { font-size: 0.65rem; color: #94a3b8; font-family: monospace; font-weight: 400; }
    .save-bar { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
    .alert.success { background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.5rem 1rem; font-size: 0.9rem; }
    .state-msg { padding: 2rem; text-align: center; color: #64748b; }
    .state-msg.error { color: #dc2626; }
    code { background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.85rem; }
  `]
})
export class AdminStoryDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private admin = inject(AdminService);

  private slugParam = toSignal(this.route.paramMap.pipe(map(p => p.get('slug'))));
  slug = computed(() => this.slugParam());

  data = signal<HistoriaScrollyEntity | null>(null);
  loading = signal(true);
  error = signal(false);

  titulo = '';
  escenas: ScrollyScene[] = [];
  svgPulido = '';

  subiendo = signal(false);
  uploadOk = signal(false);
  guardando = signal(false);
  saveOk = signal(false);
  eliminando = signal(false);

  fuenteSvgPreview = computed(() => {
    const d = this.data();
    return d?.svg_final_url || d?.json_modificado.svg_raw || '';
  });

  constructor() {
    effect(() => {
      const slug = this.slug();
      if (!slug) return;
      this.loading.set(true);
      this.admin.obtenerHistoria(slug).subscribe({
        next: (d) => {
          this.data.set(d);
          this.titulo = d.titulo;
          // Deep clone + migración legacy → V1
          this.escenas = JSON.parse(JSON.stringify(d.json_modificado.scenes));
          this.migrarEscenasALegacy();
          this.loading.set(false);
        },
        error: () => { this.error.set(true); this.loading.set(false); }
      });
    });
  }

  /** Convierte scenes legacy (animation singular) al formato V1 (animations[]) */
  private migrarEscenasALegacy() {
    for (const escena of this.escenas) {
      if (!escena.animations && escena.animation) {
        escena.animations = [{
          targetId: escena.animation.targetId,
          keyframes: { ...escena.animation.keyframes },
          offset: 0,
          duration: 1,
        }];
        // No eliminamos animation por si hay que revertir
      }
      if (!escena.animations) {
        escena.animations = [];
      }
      // Asegurar valores por defecto
      for (const anim of escena.animations) {
        if (anim.offset === undefined) anim.offset = 0;
        if (anim.duration === undefined) anim.duration = 1;
      }
    }
  }

  trackByStep(_i: number, scene: ScrollyScene): number {
    return scene.step;
  }

  agregarAnimacion(sceneIdx: number) {
    this.escenas[sceneIdx].animations!.push({
      targetId: '',
      keyframes: { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 },
      offset: 0,
      duration: 1,
    });
  }

  eliminarAnimacion(sceneIdx: number, animIdx: number) {
    this.escenas[sceneIdx].animations!.splice(animIdx, 1);
  }

  copiarSvgRaw() {
    const svg = this.data()?.json_modificado.svg_raw;
    if (svg) navigator.clipboard.writeText(svg);
  }

  promoverEstado() {
    const d = this.data();
    if (!d) return;
    const next: Record<string, string> = { 'IA_RAW': 'EDITANDO_FIGMA', 'EDITANDO_FIGMA': 'LISTO_PARA_PRODUCCION' };
    const nuevo = next[d.estado];
    if (!nuevo) return;
    this.admin.cambiarEstado(d.slug, nuevo).subscribe({ next: (v) => this.data.set(v) });
  }

  subirSvg() {
    const slug = this.slug();
    if (!slug || !this.svgPulido.trim()) return;
    this.subiendo.set(true);
    this.admin.subirSvg(slug, this.svgPulido).subscribe({
      next: () => {
        this.uploadOk.set(true);
        this.subiendo.set(false);
        this.admin.obtenerHistoria(slug).subscribe(d => this.data.set(d));
      },
      error: () => this.subiendo.set(false)
    });
  }

  guardar() {
    const d = this.data();
    const slug = this.slug();
    if (!d || !slug) return;
    this.guardando.set(true);
    this.saveOk.set(false);

    const modificado: ScrollyStoryJSON = {
      ...d.json_modificado,
      title: this.titulo,
      scenes: this.escenas,
    };

    this.admin.actualizarHistoria(slug, { json_modificado: modificado }).subscribe({
      next: (v) => {
        this.data.set(v);
        this.guardando.set(false);
        this.saveOk.set(true);
        setTimeout(() => this.saveOk.set(false), 3000);
      },
      error: () => this.guardando.set(false)
    });
  }

  eliminar() {
    const d = this.data();
    if (!d) return;
    if (!confirm(`¿Eliminar permanentemente "${d.titulo}"?`)) return;
    this.eliminando.set(true);
    this.admin.eliminarHistoria(d.slug).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => this.eliminando.set(false)
    });
  }

  /** Extrae valor inicial de una propiedad del SVG para un targetId */
  valorInicialSVG(d: HistoriaScrollyEntity, targetId: string, prop: string): string {
    const svg = d.json_modificado.svg_raw;
    if (!svg || !targetId) return '—';
    const idPattern = new RegExp(`id="${targetId}"`);
    const match = svg.match(idPattern);
    if (!match) return '—';
    const pos = match.index!;
    const beforeTag = svg.lastIndexOf('<', pos);
    if (beforeTag === -1) return '—';
    const afterTag = svg.indexOf('>', pos);
    if (afterTag === -1) return '—';
    const tagContent = svg.substring(beforeTag, afterTag + 1);

    switch (prop) {
      case 'opacity': {
        const opMatch = tagContent.match(/opacity=["']([\d.]+)["']/);
        return opMatch ? opMatch[1] : '1';
      }
      case 'fill': {
        const m = tagContent.match(/fill=["']([^"']+)["']/);
        return m ? m[1] : '—';
      }
      case 'stroke': {
        const m = tagContent.match(/stroke=["']([^"']+)["']/);
        return m ? m[1] : '—';
      }
      case 'strokeWidth': {
        const m = tagContent.match(/stroke-width=["']?([\d.]+)["']?/);
        return m ? m[1] : '—';
      }
      case 'strokeDasharray': {
        const m = tagContent.match(/stroke-dasharray=["']?([\d.]+)["']?/);
        return m ? m[1] : '—';
      }
      case 'strokeDashoffset': {
        const m = tagContent.match(/stroke-dashoffset=["']?([\d.]+)["']?/);
        return m ? m[1] : '—';
      }
      case 'scale':
      case 'x':
      case 'y':
      case 'rotation': {
        const tMatch = tagContent.match(/transform=["']([^"']+)["']/);
        if (!tMatch) return '0';
        const transform = tMatch[1];
        if (prop === 'x') {
          const xy = transform.match(/translate\(([-\d.]+)/);
          return xy ? xy[1] : '0';
        }
        if (prop === 'y') {
          const xy = transform.match(/translate\([-\d.]+\s*[,]\s*([-\d.]+)/);
          return xy ? xy[1] : '0';
        }
        if (prop === 'scale') {
          const s = transform.match(/scale\(([-\d.]+)/);
          return s ? s[1] : '1';
        }
        if (prop === 'rotation') {
          const r = transform.match(/rotate\(([-\d.]+)/);
          return r ? r[1] : '0';
        }
        return '—';
      }
      default:
        return '—';
    }
  }
}
