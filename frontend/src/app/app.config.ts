import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Optimización nativa para la detección de cambios en Angular moderno
    provideZonelessChangeDetection(),
    
    // Inyección de la estrategia de routing dinámico por slug
    provideRouter(routes),
    
    // CRUCIAL: Inicializa el cliente global de peticiones HTTP
    provideHttpClient()
  ]
};