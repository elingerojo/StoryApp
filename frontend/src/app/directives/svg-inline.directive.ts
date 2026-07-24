import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appSvgInline]',
  standalone: true
})
export class SvgInlineDirective implements OnChanges {
  @Input('appSvgInline') url!: string;

  constructor(private el: ElementRef) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['url'] && this.url) {
      try {
        const response = await fetch(this.url);
        const svgText = await response.text();
        
        // Inyectamos el SVG crudo directamente en el contenedor
        this.el.nativeElement.innerHTML = svgText;
        
        // Emitimos un evento nativo personalizado para avisar que el SVG ya existe en el DOM
        this.el.nativeElement.dispatchEvent(new CustomEvent('svg-loaded', { bubbles: true }));
      } catch (error) {
        console.error('Error cargando el SVG desde Vercel Blobs:', error);
      }
    }
  }
}
