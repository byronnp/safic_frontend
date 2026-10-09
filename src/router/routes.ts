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
        // Enlace del correo de invitación: crear la contraseña (primer ingreso)
        path: 'invitacion/:token',
        name: 'invitacion',
        component: () => import('@/modules/auth/pages/InvitacionPage.vue'),
        meta: { publica: true, titulo: 'Crear contraseña' },
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
      {
        path: 'unidades',
        name: 'unidades',
        component: () => import('@/modules/unidades/pages/UnidadesPage.vue'),
        meta: { permiso: 'unidades.ver', titulo: 'Unidades' },
      },
      {
        path: 'unidades/nueva',
        name: 'unidades-nueva',
        component: () => import('@/modules/unidades/pages/NuevaUnidadPage.vue'),
        meta: { permiso: 'unidades.editar', titulo: 'Nueva unidad', menuActivo: 'unidades' },
      },
      {
        path: 'unidades/bloques',
        name: 'bloques',
        component: () => import('@/modules/unidades/pages/BloquesPage.vue'),
        meta: { permiso: 'unidades.ver', titulo: 'Bloques' },
      },
      {
        path: 'unidades/:id(\\d+)',
        name: 'unidad-detalle',
        component: () => import('@/modules/unidades/pages/UnidadDetallePage.vue'),
        meta: { permiso: 'unidades.ver', titulo: 'Detalle de unidad', menuActivo: 'unidades' },
      },

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
      {
        path: 'configuracion/condominio',
        name: 'configuracion-condominio',
        component: () => import('@/modules/configuracion/pages/DatosCondominioPage.vue'),
        meta: { permiso: 'condominio.editar', titulo: 'Datos del condominio' },
      },
      {
        path: 'configuracion/cobro',
        name: 'configuracion-cobro',
        component: () => import('@/modules/configuracion/pages/CobroCuotasPage.vue'),
        meta: { permiso: 'condominio.editar', titulo: 'Cobro de cuotas' },
      },
      {
        path: 'configuracion/amenidades',
        name: 'configuracion-amenidades',
        component: () => import('@/modules/configuracion/pages/AmenidadesPage.vue'),
        meta: { permiso: 'amenidades.gestionar', titulo: 'Amenidades' },
      },
      {
        path: 'configuracion/usuarios',
        name: 'configuracion-usuarios',
        component: () => import('@/modules/configuracion/pages/UsuariosPage.vue'),
        meta: { permiso: 'usuarios.gestionar', titulo: 'Usuarios' },
      },
      {
        path: 'configuracion/roles',
        name: 'configuracion-roles',
        component: () => import('@/modules/configuracion/pages/RolesPage.vue'),
        meta: { permiso: 'usuarios.gestionar', titulo: 'Roles' },
      },
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
      {
        path: 'condominios',
        name: 'plataforma-condominios',
        component: () => import('@/modules/plataforma/pages/CondominiosPage.vue'),
        meta: { permiso: 'plataforma.condominios', titulo: 'Condominios' },
      },
      {
        path: 'condominios/nuevo',
        name: 'plataforma-nuevo-condominio',
        component: () => import('@/modules/plataforma/pages/NuevoCondominioPage.vue'),
        meta: {
          permiso: 'plataforma.condominios',
          titulo: 'Nuevo condominio',
          menuActivo: 'plataforma-condominios',
        },
      },
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
      {
        path: 'amenidades',
        name: 'plataforma-amenidades',
        component: () => import('@/modules/plataforma/pages/CatalogoAmenidadesPage.vue'),
        meta: { permiso: 'plataforma.condominios', titulo: 'Catálogo de amenidades' },
      },
      previa(
        'roles',
        'plataforma-roles',
        'Roles y permisos',
        () => import('@/modules/plataforma/pages/RolesPermisosPage.vue'),
      ),
      {
        path: 'menu',
        name: 'plataforma-menu',
        component: () => import('@/modules/plataforma/pages/MenuSistemaPage.vue'),
        meta: { permiso: 'plataforma.roles', titulo: 'Menú del sistema' },
      },
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
      {
        path: 'directorio',
        name: 'guardia-directorio',
        component: () => import('@/modules/app-guardia/pages/DirectorioPage.vue'),
        meta: { permiso: 'garita.directorio', titulo: 'Directorio' },
      },
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
