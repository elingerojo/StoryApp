import { Routes } from '@angular/router';
import { ScrollyPageContainerComponent } from './components/scrolly-page-container.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';
import { AdminGenerateComponent } from './admin/admin-generate.component';
import { AdminStoryDetailComponent } from './admin/admin-story-detail.component';
import { AdminStoryPreviewComponent } from './admin/admin-story-preview.component';

export const routes: Routes = [
  // ═══════════════ RUTAS ADMIN ═══════════════
  // Importante: deben ir ANTES de ':slug' para que 'admin' no sea capturado como slug
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'admin/generar', component: AdminGenerateComponent },
  { path: 'admin/:slug/preview', component: AdminStoryPreviewComponent },
  { path: 'admin/:slug', component: AdminStoryDetailComponent },

  // ═══════════════ RUTAS PÚBLICAS ═══════════════
  { path: ':slug', component: ScrollyPageContainerComponent },
  { path: '', redirectTo: '/bitcoin-pow-consensus', pathMatch: 'full' }
];
