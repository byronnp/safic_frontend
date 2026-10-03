import type { RouteRecordRaw } from 'vue-router';

import { filtrarMenu, MENU_PLATAFORMA, primeraRuta } from '@/core/navigation/menu';
import { MOSTRAR_VISTAS_PREVIAS } from '@/core/vista-previa';
import { useSessionStore } from '@/stores/session';

declare module 'vue-router' {
  interface RouteMeta {
    /** Accesible sin sesión (login). */
    publica?: boolean;
    /** Con sesión pero sin condominio elegido (selector, plataforma). Por defecto se exige condominio. */
    sinCondominio?: boolean;
    /** Panel de plataforma: exige un rol de plataforma; `permiso` se mira en sus permisos. */
    plataforma?: boolean;
    /** Permiso requerido en el condominio activo. */
    permiso?: string;
    titulo?: string;
    /** Pantalla con diseño pero sin API todavía (ver core/vista-previa.ts). */
    vistaPrevia?: boolean;
    /** App móvil: qué pestañas inferiores mostrar. */
    app?: 'residente' | 'guardia';
    /** App móvil: ocultar las pestañas inferiores (pantallas de un solo paso). */
    sinPestanas?: boolean;
    /** Ruta del menú que se marca activa en pantallas de detalle. */
    menuActivo?: string;
  }
}

/** Pantalla en vista previa: diseño del mockup con datos de ejemplo. */
function previa(
  path: string,
  name: string,
  titulo: string,
  component: RouteRecordRaw['component'],
  extra: RouteRecordRaw['meta'] = {},
): RouteRecordRaw {
  return { path, name, component: component!, meta: { titulo, vistaPrevia: true, ...extra } };
}

/**
 * Cada módulo vive en src/modules/<modulo>. Las páginas se cargan bajo demanda.
 * Toda ruta de negocio declara su permiso en `meta.permiso` (la API también lo exige).
 * Los mockups de cada pantalla están en docs/mockups (ver docs/mockups/README.md).
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

  // ---------- Administración del condominio (web) ----------
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

      // Fase 1 · Unidades
      previa(
        'unidades',
        'unidades',
        'Unidades',
        () => import('@/modules/unidades/pages/UnidadesPage.vue'),
      ),
      {
        path: 'unidades/bloques',
        name: 'bloques',
        component: () => import('@/modules/unidades/pages/BloquesPage.vue'),
        meta: { permiso: 'unidades.ver', titulo: 'Bloques' },
      },
      previa(
        'unidades/:codigo',
        'unidad-detalle',
        'Detalle de unidad',
        () => import('@/modules/unidades/pages/UnidadDetallePage.vue'),
        { menuActivo: 'unidades' },
      ),

      // Fase 2 · Finanzas
      previa(
        'finanzas',
        'finanzas-resumen',
        'Resumen financiero',
        () => import('@/modules/finanzas/pages/ResumenPage.vue'),
      ),
      previa(
        'finanzas/pagos-por-aprobar',
        'finanzas-pagos-por-aprobar',
        'Pagos por aprobar',
        () => import('@/modules/finanzas/pages/PagosPorAprobarPage.vue'),
      ),
      previa(
        'finanzas/conciliacion',
        'finanzas-conciliacion',
        'Conciliación bancaria',
        () => import('@/modules/finanzas/pages/ConciliacionPage.vue'),
      ),
      previa(
        'finanzas/cuentas-por-pagar',
        'finanzas-cuentas-por-pagar',
        'Cuentas por pagar',
        () => import('@/modules/finanzas/pages/CuentasPorPagarPage.vue'),
      ),
      previa(
        'finanzas/cuentas-por-pagar/:id/pago',
        'finanzas-pago-proveedor',
        'Registrar pago a proveedor',
        () => import('@/modules/finanzas/pages/PagoProveedorPage.vue'),
        { menuActivo: 'finanzas-cuentas-por-pagar' },
      ),

      // Fase 3 · Áreas comunes
      previa(
        'areas-comunes/agenda',
        'areas-agenda',
        'Agenda de reservas',
        () => import('@/modules/reservas/pages/AgendaPage.vue'),
      ),
      previa(
        'areas-comunes/areas',
        'areas-reglas',
        'Configurar área',
        () => import('@/modules/reservas/pages/AreasPage.vue'),
      ),

      // Fase 4 · Seguridad y comunicación
      previa(
        'comunicacion/anuncios',
        'comunicacion-anuncios',
        'Anuncios',
        () => import('@/modules/comunicacion/pages/AnunciosPage.vue'),
      ),
      previa(
        'comunicacion/incidencias',
        'comunicacion-incidencias',
        'Incidencias',
        () => import('@/modules/comunicacion/pages/IncidenciasPage.vue'),
      ),

      // Fase 5 · Asambleas
      previa(
        'asambleas/preparar',
        'asambleas-preparar',
        'Preparar asamblea',
        () => import('@/modules/asambleas/pages/PrepararAsambleaPage.vue'),
      ),
      previa(
        'asambleas/mesa',
        'asambleas-mesa',
        'Mesa de la asamblea',
        () => import('@/modules/asambleas/pages/MesaAsambleaPage.vue'),
      ),

      // Configuración del condominio
      previa(
        'configuracion/condominio',
        'configuracion-condominio',
        'Datos del condominio',
        () => import('@/modules/configuracion/pages/DatosCondominioPage.vue'),
      ),
      previa(
        'configuracion/amenidades',
        'configuracion-amenidades',
        'Amenidades',
        () => import('@/modules/configuracion/pages/AmenidadesPage.vue'),
      ),
      previa(
        'configuracion/usuarios',
        'configuracion-usuarios',
        'Usuarios',
        () => import('@/modules/configuracion/pages/UsuariosPage.vue'),
      ),
      previa(
        'configuracion/roles',
        'configuracion-roles',
        'Roles',
        () => import('@/modules/configuracion/pages/RolesPage.vue'),
      ),
      previa(
        'configuracion/suscripcion',
        'configuracion-suscripcion',
        'Mi suscripción',
        () => import('@/modules/configuracion/pages/SuscripcionPage.vue'),
      ),

      {
        path: 'sin-permiso',
        name: 'sin-permiso',
        component: () => import('@/pages/SinPermisoPage.vue'),
        meta: { titulo: 'Sin permiso' },
      },
    ],
  },

  // ---------- Plataforma (super admin) ----------
  {
    path: '/plataforma',
    component: () => import('@/layouts/PlataformaLayout.vue'),
    meta: { sinCondominio: true, plataforma: true },
    children: [
      {
        // Entrada del panel: la primera pantalla que permite el perfil de plataforma.
        path: '',
        name: 'plataforma',
        redirect: () => {
          const session = useSessionStore();
          const ruta = primeraRuta(
            filtrarMenu(MENU_PLATAFORMA, session.permisosPlataforma, {
              vistasPrevias: MOSTRAR_VISTAS_PREVIAS,
            }),
          );
          return { name: ruta ?? 'plataforma-sin-permiso' };
        },
      },
      {
        path: 'sin-permiso',
        name: 'plataforma-sin-permiso',
        component: () => import('@/pages/SinPermisoPage.vue'),
        meta: { titulo: 'Sin permiso' },
      },
      previa(
        'cobranza',
        'plataforma-cobranza',
        'Cobranza',
        () => import('@/modules/plataforma/pages/CobranzaPage.vue'),
      ),
      previa(
        'condominios',
        'plataforma-condominios',
        'Condominios',
        () => import('@/modules/plataforma/pages/CondominiosPage.vue'),
      ),
      previa(
        'condominios/nuevo',
        'plataforma-nuevo-condominio',
        'Nuevo condominio',
        () => import('@/modules/plataforma/pages/NuevoCondominioPage.vue'),
        { menuActivo: 'plataforma-condominios' },
      ),
      previa(
        'condominios/:id/cuenta',
        'plataforma-cuenta-condominio',
        'Cuenta del condominio',
        () => import('@/modules/plataforma/pages/CuentaCondominioPage.vue'),
        { menuActivo: 'plataforma-cobranza' },
      ),
      previa(
        'planes',
        'plataforma-planes',
        'Planes y módulos',
        () => import('@/modules/plataforma/pages/PlanesPage.vue'),
      ),
      previa(
        'amenidades',
        'plataforma-amenidades',
        'Catálogo de amenidades',
        () => import('@/modules/plataforma/pages/CatalogoAmenidadesPage.vue'),
      ),
      previa(
        'roles',
        'plataforma-roles',
        'Roles y permisos',
        () => import('@/modules/plataforma/pages/RolesPermisosPage.vue'),
      ),
      previa(
        'menu',
        'plataforma-menu',
        'Menú del sistema',
        () => import('@/modules/plataforma/pages/MenuSistemaPage.vue'),
      ),
      previa(
        'configuracion',
        'plataforma-configuracion',
        'Configuración de cobro',
        () => import('@/modules/plataforma/pages/ConfiguracionCobroPage.vue'),
      ),
    ],
  },

  // ---------- App móvil del residente ----------
  {
    path: '/app',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { app: 'residente' },
    children: [
      { path: '', redirect: { name: 'app-mi-hogar' } },
      previa(
        'mi-hogar',
        'app-mi-hogar',
        'Mi hogar',
        () => import('@/modules/app-residente/pages/MiHogarPage.vue'),
      ),
      previa(
        'mi-cuenta',
        'app-mi-cuenta',
        'Mi cuenta',
        () => import('@/modules/app-residente/pages/MiCuentaPage.vue'),
      ),
      previa(
        'pagar',
        'app-pagar',
        'Pagar por transferencia',
        () => import('@/modules/app-residente/pages/PagarPage.vue'),
        { sinPestanas: true, menuActivo: 'app-mi-cuenta' },
      ),
      previa(
        'reservar',
        'app-reservar',
        'Reservar',
        () => import('@/modules/app-residente/pages/ReservarPage.vue'),
      ),
      previa(
        'visitas/nueva',
        'app-nueva-visita',
        'Nueva visita',
        () => import('@/modules/app-residente/pages/NuevaVisitaPage.vue'),
      ),
      previa(
        'asamblea',
        'app-asamblea',
        'Asamblea en vivo',
        () => import('@/modules/app-residente/pages/VotarPage.vue'),
      ),
    ],
  },

  // ---------- App móvil del guardia ----------
  {
    path: '/guardia',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { app: 'guardia' },
    children: [
      { path: '', redirect: { name: 'guardia-garita' } },
      previa(
        'garita',
        'guardia-garita',
        'Garita',
        () => import('@/modules/app-guardia/pages/GaritaPage.vue'),
      ),
      previa(
        'directorio',
        'guardia-directorio',
        'Directorio',
        () => import('@/modules/app-guardia/pages/DirectorioPage.vue'),
      ),
      previa(
        'reservas-hoy',
        'guardia-reservas-hoy',
        'Reservas de hoy',
        () => import('@/modules/app-guardia/pages/ReservasHoyPage.vue'),
      ),
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
    meta: { publica: true },
  },
];

export default routes;
