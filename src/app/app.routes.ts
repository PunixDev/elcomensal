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
    path: 'admin/estadisticas',
    loadComponent: () =>
      import('./admin/estadisticas.page').then((m) => m.EstadisticasPage),
  },
  {
    path: 'admin/analytics',
    loadComponent: () =>
      import('./admin/analytics/analytics.page').then((m) => m.AnalyticsPage),
  },

  {
    path: 'admin/promotions',
    loadComponent: () => import('./admin/promotions/promotions.page').then((m) => m.PromotionsPage),
  },
  {
    path: 'suscripcion',
    loadComponent: () =>
      import('./suscripcion/suscripcion.page').then((m) => m.SuscripcionPage),
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
      import('./informe-mesa/informe-mesa.page').then((m) => m.InformeMesaPage),
  },
  {
    path: 'aviso-legal',
    loadComponent: () =>
      import('./aviso-legal/aviso-legal.page').then((m) => m.AvisoLegalPage),
  },
  {
    path: 'sobre-nosotros',
    loadComponent: () =>
      import('./sobre-nosotros/sobre-nosotros.page').then(
        (m) => m.SobreNosotrosPage
      ),
  },
];
