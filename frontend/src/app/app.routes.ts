import { Routes } from '@angular/router';
import { ScrollyPageContainerComponent } from './components/scrolly-page-container.component';

export const routes: Routes = [
  // Cualquier URL con texto cargará el mismo componente base
  { path: ':slug', component: ScrollyPageContainerComponent },
  { path: '', redirectTo: '/oauth2-flow', pathMatch: 'full' }
];
