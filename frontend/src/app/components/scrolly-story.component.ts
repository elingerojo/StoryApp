import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgInlineDirective } from './directives/svg-inline.directive';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-scrolly-story',
  standalone: true,
  imports: [CommonModule, SvgInlineDirective],
  template: `
    <div #container class="scrolly-container">
      <!-- CONTENEDOR FIJO (PINNED): Renderiza el SVG de Vercel Blobs -->
      <div #canvas class="visual-canvas" [appSvgInline]="storyData.svg_final_url"></div>

      <!-- CONTENEDOR DESLIZABLE: Bloques de texto explicativos -->
      <div class="text-layers">
        <div *ngFor="let scene of storyData.json_modificado.scenes" class="step-card">
          <div class="card-content">
            <p>{{ scene.text }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scrolly-container { position: relative; width: 100%; display: flex; }
    .visual-canvas { 
      position: relative; width: 60%; height: 100vh; 
      display: flex; align-items: center; justify-content: center; 
    }
    ::v-deep .visual-canvas svg { width: 100%; height: auto; max-height: 80vh; }
    .text-layers { width: 40%; }
    .step-card { 
      height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; 
    }
    .card-content { background: rgba(255,255,255,0.9); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  `]
})
export class ScrollyStoryComponent {
  @Input() storyData!: any; // Recibe la fila directa de Neon
  @ViewChild('container') container!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef;

  // Escuchamos el evento de la directiva para garantizar que los IDs del SVG ya existen
  @HostListener('svg-loaded')
  onSvgLoaded() {
    this.initScrollAnimations();
  }

  initScrollAnimations() {
    // 1. Configurar PINNING del elemento visual
    ScrollTrigger.create({
      trigger: this.container.nativeElement,
      start: 'top top',
      end: 'bottom bottom',
      pin: this.canvas.nativeElement,
      scrub: true
    });

    // 2. Línea de tiempo maestra basada en PROGRESO (Scrub)
    const masterTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: this.container.nativeElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1 // Suavizado para evitar brincos bruscos del usuario
      }
    });

    // 3. Orquestación automática usando los IDs e instrucciones de Gemini
    const scenes = this.storyData.json_modificado.scenes;
    scenes.forEach((scene: any) => {
      masterTimeline.to(scene.animation.targetId, {
        ...scene.animation.keyframes,
        duration: 1 // Distribución equitativa a lo largo del scroll
      });
    });
  }
}
