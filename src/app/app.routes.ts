import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./categorias/categorias.page').then((m) => m.CategoriasPage),
  },
  {
    path: 'productos',
    loadComponent: () =>
      import('./productos/productos.page').then((m) => m.ProductosPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'carta/:barId',
    loadComponent: () => import('./carta.page').then((m) => m.CartaPage),
  },
  {
    path: 'carta',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'generar-qr',
    loadComponent: () =>
      import('./generar-qr.page').then((m) => m.GenerarQrPage),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./registro/registro.page').then((m) => m.RegistroPage),
  },
  {
    path: 'recuperar',
    loadComponent: () =>
      import('./recuperar/recuperar.page').then((m) => m.RecuperarPage),
  },
  {
    path: 'suscripcion',
    loadComponent: () =>
      import('./suscripcion/suscripcion.page').then((m) => m.SuscripcionPage),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./historial.page').then((m) => m.HistorialPage),
  },
  {
    path: 'informe-mesa/:mesa',
    loadComponent: () =>
      import('./informe-mesa.page').then((m) => m.InformeMesaPage),
  },
];
