import type { RouteRecordRaw } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** Accesible sin sesión (login). */
    publica?: boolean;
    /** Con sesión pero sin condominio elegido (selector). Por defecto se exige condominio. */
    sinCondominio?: boolean;
    /** Permiso requerido en el condominio activo. */
    permiso?: string;
    titulo?: string;
  }
}

/**
 * Cada módulo vive en src/modules/<modulo>. Las páginas se cargan bajo demanda.
 * Toda ruta de negocio declara su permiso en `meta.permiso` (la API también lo exige).
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/modules/auth/pages/LoginPage.vue'),
        meta: { publica: true, titulo: 'Iniciar sesión' },
      },
      {
        path: 'condominios',
        name: 'seleccionar-condominio',
        component: () => import('@/modules/auth/pages/SeleccionarCondominioPage.vue'),
        meta: { sinCondominio: true, titulo: 'Elegir condominio' },
      },
    ],
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'inicio',
        component: () => import('@/modules/inicio/pages/InicioPage.vue'),
        meta: { titulo: 'Inicio' },
      },
      {
        path: 'unidades/bloques',
        name: 'bloques',
        component: () => import('@/modules/unidades/pages/BloquesPage.vue'),
        meta: { permiso: 'unidades.ver', titulo: 'Bloques' },
      },
      {
        path: 'sin-permiso',
        name: 'sin-permiso',
        component: () => import('@/pages/SinPermisoPage.vue'),
        meta: { titulo: 'Sin permiso' },
      },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
    meta: { publica: true },
  },
];

export default routes;
