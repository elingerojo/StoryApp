import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgInlineDirective } from '../directives/svg-inline.directive';
import { HistoriaScrollyEntity } from '@shared/interfaces';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registrar el plugin de forma explícita para evitar problemas de optimización en producción
gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-scrolly-story',
  standalone: true,
  imports: [CommonModule, SvgInlineDirective],
  template: `
    <div #container class="scrolly-container">
      <!-- CONTENEDOR FIJO (PINNED): Renderiza el SVG (IA Raw o Vercel Blobs) -->
      <div #canvas class="visual-canvas" [appSvgInline]="fuenteSvg"></div>

      <!-- CONTENEDOR DESLIZABLE: Bloques de texto que empujan el scroll -->
      <div class="text-layers">
        <div *ngFor="let scene of historia.scenes" class="step-card">
          <div class="card-content">
            <span class="step-badge">Paso {{ scene.step }}</span>
            <p>{{ scene.text }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scrolly-container { 
      position: relative; 
      width: 100%; 
      display: flex; 
      background-color: #0f172a; /* Fondo oscuro moderno para resaltar diagramas */
    }
    .visual-canvas { 
      position: relative; 
      width: 60%; 
      height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      overflow: hidden;
    }
    /* Estilizado profundo para que el SVG inyectado se adapte al contenedor */
    ::v-deep .visual-canvas svg { 
      width: 90%; 
      height: auto; 
      max-height: 80vh; 
    }
    .text-layers { 
      width: 40%; 
      z-index: 10;
    }
    .step-card { 
      height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 3rem; 
      box-sizing: border-box;
    }
    .card-content { 
      background: rgba(30, 41, 59, 0.95); 
      color: #f8fafc;
      padding: 2rem; 
      border-radius: 12px; 
      border: 1px solid #334155;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
      backdrop-filter: blur(8px);
      width: 100%;
    }
    .step-badge {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #38bdf8;
      font-weight: 700;
      display: block;
      margin-bottom: 0.5rem;
    }
    .card-content p {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 1.1rem;
      line-height: 1.6;
      margin: 0;
    }
  `]
})
export class ScrollyStoryComponent {
  @Input() storyData!: HistoriaScrollyEntity;

  @ViewChild('container') container!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef;

  /**
   * Determina inteligentemente qué origen usar para el SVG según la fase del MVP
   */
  get fuenteSvg(): string {
    return this.storyData.svg_final_url || this.storyData.json_modificado.svg_raw;
  }

  /**
   * Facilita el acceso directo al JSON que contiene las escenas y animaciones
   */
  get historia() {
    return this.storyData.json_modificado;
  }

  /**
   * Escucha el evento personalizado de la directiva.
   * Esto asegura que los vectores e IDs ya están físicamente en el DOM antes de inicializar GSAP.
   */
  @HostListener('svg-loaded')
  onSvgLoaded() {
    // Limpiar instancias previas de ScrollTrigger para evitar fugas de memoria al cambiar de ruta
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    
    // Inicializar el motor de scroll
    this.initScrollAnimations();
  }

  private initScrollAnimations() {
    // 1. Configurar PINNING: El contenedor visual se queda congelado en pantalla
    ScrollTrigger.create({
      trigger: this.container.nativeElement,
      start: 'top top',
      end: 'bottom bottom',
      pin: this.canvas.nativeElement,
      scrub: true
    });

    // 2. Crear la Línea de Tiempo Maestra vinculada al progreso del scroll (SCRUB)
    const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: this.container.nativeElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1 // Suavizado de 1 segundo para amortiguar el scroll del usuario
      }
    });

    // 3. Orquestación Dinámica: Mapear los keyframes que la IA estructuró en la base de datos
    this.historia.scenes.forEach((scene) => {
      masterTimeline.to(scene.animation.targetId, {
        ...scene.animation.keyframes,
        duration: 1 // GSAP distribuye esta duración equitativamente a lo largo del scroll total
      });
    });
  }
}