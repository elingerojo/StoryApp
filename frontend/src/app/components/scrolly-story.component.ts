import { Component, computed, ElementRef, input, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgInlineDirective } from '../directives/svg-inline.directive';
import { HistoriaScrollyEntity } from '../../../../backend/src/shared/interfaces';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registrar el plugin de forma explícita para evitar problemas de optimización en producción
gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-scrolly-story',
  standalone: true,
  imports: [CommonModule, SvgInlineDirective],
  host: {
    '(svg-loaded)': 'onSvgLoaded()'
  },
  template: `
    <div #container class="scrolly-container">
      <!-- CONTENEDOR FIJO (PINNED): Renderiza el SVG (IA Raw o Vercel Blobs) -->
      <div #canvas class="visual-canvas" [appSvgInline]="fuenteSvg()"></div>

      <!-- CONTENEDOR DESLIZABLE: Bloques de texto que empujan el scroll -->
      <div class="text-layers">
        <div *ngFor="let scene of historia().scenes" class="step-card">
          <div class="card-content">
            <span class="step-badge">Paso {{ scene.step }}</span>
            <p>{{ scene.text }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ================================================================
       MOBILE-FIRST SCROLLYTELLING
       ================================================================
       Por defecto (móvil): SVG pinned arriba (45vh), texto abajo.
       A partir de 768px (tablet/desktop): SVG izquierda, texto derecha.
    ================================================================ */

    .scrolly-container {
      position: relative;
      width: 100%;
      background-color: #0f172a;
    }

    /* ── Canvas SVG: Ocupa todo el ancho, altura reducida ── */
    .visual-canvas {
      position: relative;
      width: 100%;
      height: 45vh;
      min-height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    ::v-deep .visual-canvas svg {
      width: 95%;
      height: auto;
      max-height: 40vh;
    }

    /* ── Texto: Ancho completo, cards más compactas ── */
    .text-layers {
      width: 100%;
      z-index: 10;
    }
    .step-card {
      min-height: 55vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.2rem;
      box-sizing: border-box;
    }
    .card-content {
      background: rgba(30, 41, 59, 0.95);
      color: #f8fafc;
      padding: 1.2rem;
      border-radius: 12px;
      border: 1px solid #334155;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
      backdrop-filter: blur(8px);
      width: 100%;
      max-width: 500px;
    }
    .step-badge {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #38bdf8;
      font-weight: 700;
      display: block;
      margin-bottom: 0.4rem;
    }
    .card-content p {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0;
    }

    /* ── TABLET / DESKTOP (>= 768px) ── */
    @media (min-width: 768px) {
      .scrolly-container {
        display: flex;
      }
      .visual-canvas {
        width: 60%;
        height: 100vh;
        position: relative;
      }
      ::v-deep .visual-canvas svg {
        width: 90%;
        height: auto;
        max-height: 80vh;
      }
      .text-layers {
        width: 40%;
      }
      .step-card {
        height: 100vh;
        padding: 3rem;
        min-height: unset;
      }
      .card-content {
        padding: 2rem;
        max-width: unset;
      }
      .card-content p {
        font-size: 1.1rem;
        line-height: 1.6;
      }
      .step-badge {
        font-size: 0.8rem;
      }
    }
  `]
})
export class ScrollyStoryComponent {
  /** Input signal requerida — el componente no funciona sin los datos de la historia */
  storyData = input.required<HistoriaScrollyEntity>();

  /** Referencias reactivas al DOM mediante viewChild */
  container = viewChild<ElementRef>('container');
  canvas = viewChild<ElementRef>('canvas');

  /**
   * Determina inteligentemente qué origen usar para el SVG según la fase del MVP.
   * Signal computada: se recalcula automáticamente si storyData cambia.
   */
  protected fuenteSvg = computed(() => {
    const data = this.storyData();
    return data.svg_final_url || data.json_modificado.svg_raw;
  });

  /**
   * Expone el JSON modificado con escenas y animaciones.
   * Signal computada derivada de storyData.
   */
  protected historia = computed(() => this.storyData().json_modificado);

  /**
   * Escucha el evento personalizado 'svg-loaded' emitido por la directiva SvgInlineDirective.
   * Esto asegura que los vectores e IDs ya están físicamente en el DOM antes de inicializar GSAP.
   * El binding se define en la propiedad 'host' del decorador @Component.
   */
  onSvgLoaded() {
    // Limpiar instancias previas de ScrollTrigger para evitar fugas de memoria al cambiar de ruta
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());

    setTimeout(() => {
      // Validamos por seguridad que las referencias existan en el DOM antes de dárselas a GSAP
      if (this.container() && this.canvas()) {
        this.initScrollAnimations();
      } else {
        console.warn('⚠️ Las referencias del DOM aún no están listas para GSAP.');
      }
    }, 0);
  }

  private initScrollAnimations() {
    // 1. Obtener la referencia nativa del contenedor del canvas donde se inyectó el SVG
    const canvasEl = this.canvas()!.nativeElement as HTMLElement;

    // 2. Configurar PINNING
    ScrollTrigger.create({
      trigger: this.container()!.nativeElement,
      start: 'top top',
      end: 'bottom bottom',
      pin: this.canvas()!.nativeElement,
      scrub: true
    });

    // 3. Crear la Línea de Tiempo Maestra
    const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: this.container()!.nativeElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    // 4. Obtener todas las animaciones (soporta legacy + V1)
    const animaciones = this.extraerAnimaciones();
    
    // 5. Orquestación Dinámica con Múltiples Animaciones por Escena
    animaciones.forEach(({ elemento, keyframes, offset, duration }) => {
      if (elemento) {
        masterTimeline.to(elemento, {
          ...keyframes,
          duration: duration ?? 1
        }, offset ?? 0);
        //                     ↑ El 3er parámetro de timeline.to() es la POSICIÓN
        //                      0 = inicio de la escena, 0.5 = medio segundo después
      } else {
        console.warn(`⚠️ Elemento SVG no encontrado para animación.`);
      }
    });
  }

  /**
   * Extrae todas las animaciones de todas las escenas, soportando:
   * - [LEGACY] scene.animation (objeto único)
   * - [V1]     scene.animations (array con offset y duration)
   *
   * Convierte cada animación en un objeto plano para la timeline de GSAP.
   */
  private extraerAnimaciones(): Array<{
    elemento: HTMLElement | null;
    keyframes: Record<string, any>;
    offset: number;
    duration: number;
  }> {
    const canvasEl = this.canvas()?.nativeElement as HTMLElement | undefined;
    if (!canvasEl) return [];

    const resultado: Array<{
      elemento: HTMLElement | null;
      keyframes: Record<string, any>;
      offset: number;
      duration: number;
    }> = [];

    this.historia().scenes.forEach((scene) => {
      // Determinar qué animaciones usar (V1 > legacy)
      const anims = scene.animations?.length
        ? scene.animations
        : (scene.animation ? [scene.animation] : []);

      anims.forEach((anim) => {
        const idLimpio = anim.targetId.replace('#', '');
        const elemento = canvasEl.querySelector(`#${idLimpio}`);
        
        if (!elemento) {
          console.warn(`⚠️ No se encontró la capa física con id="${idLimpio}" dentro del SVG renderizado.`);
        }

        resultado.push({
          elemento: elemento as HTMLElement | null,
          keyframes: { ...anim.keyframes },
          offset: anim.offset ?? 0,
          duration: anim.duration ?? 1,
        });
      });
    });

    return resultado;
  }
}
