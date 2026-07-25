import { Directive, ElementRef, inject, input, effect } from '@angular/core';

@Directive({
  selector: '[appSvgInline]',
  standalone: true
})
export class SvgInlineDirective {
  // El elemento nativo del DOM donde se inyectará el SVG
  private el = inject(ElementRef);

  /**
   * Input signal: puede recibir una URL de Vercel Blobs o el código SVG dinámico crudo de la IA.
   * Usamos 'alias' para mantener la sintaxis [appSvgInline]="..." en el template.
   */
  source = input<string | null>(null, { alias: 'appSvgInline' });

  constructor() {
    // Efecto reactivo: se dispara automáticamente cuando source() cambia
    effect(() => {
      const valor = this.source();
      
      if (!valor) return;

      const trimmed = valor.trim();

      // Verificar si el source es una URL (Vercel Blobs) o código SVG directo
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        this.descargarEInyectarDesdeUrl(trimmed);
      } else if (trimmed.startsWith('<svg')) {
        this.inyectarSvgCrudo(trimmed);
      } else {
        console.warn('⚠️ El formato proporcionado a appSvgInline no es válido.');
      }
    });
  }

  /**
   * Fase 3: Descarga el SVG desde el CDN de Vercel Blobs e inyecta sus vectores
   */
  private async descargarEInyectarDesdeUrl(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const svgText = await response.text();
      this.inyectarSvgCrudo(svgText);
    } catch (error) {
      console.error('❌ Error descargando el SVG desde Vercel Blobs:', error);
      this.el.nativeElement.innerHTML = `<p style="color:red; padding:2rem;">Error al cargar el gráfico vectorial.</p>`;
    }
  }

  /**
   * Fase 1: Inyecta el string de vectores directamente en el DOM y despacha el evento de éxito
   */
  private inyectarSvgCrudo(svgContent: string): void {
    this.el.nativeElement.innerHTML = svgContent;
    
    // Disparar un evento nativo personalizado para notificar a GSAP que los IDs ya existen en el DOM
    this.el.nativeElement.dispatchEvent(
      new CustomEvent('svg-loaded', { bubbles: true })
    );
  }
}
