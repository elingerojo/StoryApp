import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

@Directive({
  selector: '[appSvgInline]',
  standalone: true
})
export class SvgInlineDirective implements OnChanges {
  // El elemento nativo del DOM donde se inyectará el SVG
  private el = inject(ElementRef);

  // Puede recibir una URL de Vercel Blobs o el código SVG dinámico crudo de la IA
  @Input('appSvgInline') source!: string | null;

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['source'] && this.source) {
      const valor = this.source.trim();

      // Verificar si el source es una URL (Vercel Blobs) o código SVG directo
      if (valor.startsWith('http://') || valor.startsWith('https://')) {
        await this.descargarEInyectarDesdeUrl(valor);
      } else if (valor.startsWith('<svg')) {
        this.inyectarSvgCrudo(valor);
      } else {
        console.warn('⚠️ El formato proporcionado a appSvgInline no es válido.');
      }
    }
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