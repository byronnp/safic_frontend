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
        // Sin este hijo, una carga completa de «/» (recarga o URL directa) se resuelve al layout de login solo y queda en blanco:
        // los dos layouts empatan en «/» y gana el primero. Aquí se manda a «inicio» y la guarda decide si hay sesión.
        path: '',
        redirect: { name: 'inicio' },
      },
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
        // Página pública del QR de una visita: la abre el visitante desde el enlace que le comparte el residente
        path: 'visita/:token',
        name: 'visita-publica',
        component: () => import('@/modules/garita/pages/VisitaQrPage.vue'),
        meta: { publica: true, titulo: 'Tu visita' },
      },
      {
        path: 'condominios',
        name: 'seleccionar-condominio',
        component: () => import('@/modules/auth/pages/SeleccionarCondominioPage.vue'),
        meta: { sinCondominio: true, titulo: 'Elegir condominio' },
      },
      {
        // Verificación en dos pasos de la propia cuenta. El contador sin ella solo llega aquí.
        path: 'seguridad/doble-factor',
        name: 'doble-factor',
        component: () => import('@/modules/auth/pages/DobleFactorPage.vue'),
        meta: { sinCondominio: true, titulo: 'Verificación en dos pasos' },
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
      {
        path: 'finanzas',
        name: 'finanzas-resumen',
        component: () => import('@/modules/finanzas/pages/ResumenPage.vue'),
        meta: { permiso: 'finanzas.ver', titulo: 'Resumen financiero' },
      },
      {
        path: 'finanzas/pagos-por-aprobar',
        name: 'finanzas-pagos-por-aprobar',
        component: () => import('@/modules/finanzas/pages/PagosPorAprobarPage.vue'),
        meta: { permiso: 'pagos.aprobar', titulo: 'Pagos por aprobar' },
      },
      {
        path: 'finanzas/cuotas',
        name: 'finanzas-cuotas',
        component: () => import('@/modules/finanzas/pages/CuotasPage.vue'),
        meta: { permiso: 'finanzas.ver', titulo: 'Cuotas del mes' },
      },
      {
        path: 'finanzas/cierre',
        name: 'finanzas-cierre-mes',
        component: () => import('@/modules/finanzas/pages/CierreMesPage.vue'),
        meta: { permiso: 'finanzas.ver', titulo: 'Cierre de mes' },
      },
      {
        path: 'finanzas/conciliacion',
        name: 'finanzas-conciliacion',
        component: () => import('@/modules/finanzas/pages/ConciliacionPage.vue'),
        meta: { permiso: 'finanzas.ver', titulo: 'Conciliación bancaria' },
      },
      {
        path: 'finanzas/morosidad',
        name: 'finanzas-morosidad',
        component: () => import('@/modules/finanzas/pages/MorosidadPage.vue'),
        meta: { permiso: 'finanzas.ver', titulo: 'Morosidad' },
      },
      {
        path: 'finanzas/reportes',
        name: 'finanzas-reportes',
        component: () => import('@/modules/finanzas/pages/ReportesPage.vue'),
        meta: { permiso: 'finanzas.ver', titulo: 'Reportes' },
      },
      {
        path: 'finanzas/recurrentes',
        name: 'finanzas-recurrentes',
        component: () => import('@/modules/finanzas/pages/RecurrentesPage.vue'),
        meta: { permiso: 'finanzas.ver', titulo: 'Gastos recurrentes' },
      },
      {
        path: 'finanzas/caja-chica',
        name: 'finanzas-caja-chica',
        component: () => import('@/modules/finanzas/pages/CajaChicaPage.vue'),
        meta: { permiso: 'cajachica.registrar', titulo: 'Caja chica' },
      },
      {
        path: 'finanzas/cuentas-por-pagar',
        name: 'finanzas-cuentas-por-pagar',
        component: () => import('@/modules/finanzas/pages/CuentasPorPagarPage.vue'),
        meta: { permiso: 'finanzas.ver', titulo: 'Cuentas por pagar' },
      },
      {
        path: 'finanzas/proveedores',
        name: 'finanzas-proveedores',
        component: () => import('@/modules/finanzas/pages/ProveedoresPage.vue'),
        meta: { permiso: 'finanzas.ver', titulo: 'Proveedores' },
      },
      {
        path: 'finanzas/cuentas-por-pagar/:id(\\d+)/pago',
        name: 'finanzas-pago-proveedor',
        component: () => import('@/modules/finanzas/pages/PagoProveedorPage.vue'),
        meta: {
          permiso: 'gastos.pagar',
          titulo: 'Registrar pago a proveedor',
          menuActivo: 'finanzas-cuentas-por-pagar',
        },
      },
      {
        path: 'finanzas/aprobaciones',
        name: 'finanzas-aprobaciones',
        component: () => import('@/modules/finanzas/pages/AprobacionesPage.vue'),
        meta: { permiso: 'gastos.aprobar-n2', titulo: 'Aprobaciones pendientes' },
      },

      // Fase 3 · Áreas comunes
      {
        path: 'areas-comunes/agenda',
        name: 'areas-agenda',
        component: () => import('@/modules/reservas/pages/AgendaPage.vue'),
        meta: { permiso: 'reservas.gestionar', titulo: 'Agenda de reservas' },
      },
      {
        path: 'areas-comunes/areas',
        name: 'areas-reglas',
        component: () => import('@/modules/reservas/pages/AreasPage.vue'),
        meta: { permiso: 'reservas.gestionar', titulo: 'Áreas y reglas' },
      },

      // Fase 4 · Seguridad y comunicación
      {
        path: 'comunicacion/bitacora',
        name: 'garita-bitacora',
        component: () => import('@/modules/garita/pages/BitacoraPage.vue'),
        meta: { permiso: 'garita.bitacora', titulo: 'Bitácora de garita' },
      },
      {
        path: 'comunicacion/anuncios',
        name: 'comunicacion-anuncios',
        component: () => import('@/modules/comunicacion/pages/AnunciosPage.vue'),
        meta: { permiso: 'anuncios.publicar', titulo: 'Anuncios' },
      },
      {
        path: 'comunicacion/incidencias',
        name: 'comunicacion-incidencias',
        component: () => import('@/modules/comunicacion/pages/IncidenciasPage.vue'),
        meta: { permiso: 'incidencias.gestionar', titulo: 'Incidencias' },
      },

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
      {
        // La misma pantalla del asistente, con los datos del condominio (solo super admin)
        path: 'condominios/:id(\\d+)/editar',
        name: 'plataforma-editar-condominio',
        component: () => import('@/modules/plataforma/pages/NuevoCondominioPage.vue'),
        meta: {
          permiso: 'plataforma.condominios-editar',
          titulo: 'Editar condominio',
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
      {
        path: 'roles',
        name: 'plataforma-roles',
        component: () => import('@/modules/plataforma/pages/RolesPermisosPage.vue'),
        meta: { permiso: 'plataforma.roles', titulo: 'Roles y permisos' },
      },
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
      {
        path: 'mi-cuenta',
        name: 'app-mi-cuenta',
        component: () => import('@/modules/app-residente/pages/MiCuentaPage.vue'),
        meta: { permiso: 'cuenta.propia', titulo: 'Mi cuenta' },
      },
      {
        path: 'pagar',
        name: 'app-pagar',
        component: () => import('@/modules/app-residente/pages/PagarPage.vue'),
        meta: {
          permiso: 'cuenta.propia',
          titulo: 'Pagar por transferencia',
          sinPestanas: true,
          menuActivo: 'app-mi-cuenta',
        },
      },
      {
        path: 'areas',
        name: 'app-areas',
        component: () => import('@/modules/app-residente/pages/AreasPage.vue'),
        meta: { permiso: 'reservas.propias', titulo: 'Áreas comunes' },
      },
      {
        path: 'reservas',
        name: 'app-mis-reservas',
        component: () => import('@/modules/app-residente/pages/MisReservasPage.vue'),
        meta: { permiso: 'reservas.propias', titulo: 'Mis reservas', menuActivo: 'app-areas' },
      },
      {
        path: 'reservar',
        name: 'app-reservar',
        component: () => import('@/modules/app-residente/pages/ReservarPage.vue'),
        meta: {
          permiso: 'reservas.propias',
          titulo: 'Reservar',
          sinPestanas: true,
          menuActivo: 'app-areas',
        },
      },
      {
        path: 'incidencias',
        name: 'app-incidencias',
        component: () => import('@/modules/app-residente/pages/MisIncidenciasPage.vue'),
        meta: { permiso: 'incidencias.reportar', titulo: 'Incidencias' },
      },
      {
        path: 'avisos',
        name: 'app-avisos',
        component: () => import('@/modules/app-residente/pages/AvisosPage.vue'),
        meta: { permiso: 'avisos.propios', titulo: 'Avisos' },
      },
      {
        path: 'visitas',
        name: 'app-mis-visitas',
        component: () => import('@/modules/app-residente/pages/MisVisitasPage.vue'),
        meta: { permiso: 'visitas.propias', titulo: 'Mis visitas' },
      },
      {
        path: 'visitas/nueva',
        name: 'app-nueva-visita',
        component: () => import('@/modules/app-residente/pages/NuevaVisitaPage.vue'),
        meta: {
          permiso: 'visitas.propias',
          titulo: 'Nueva visita',
          sinPestanas: true,
          menuActivo: 'app-mis-visitas',
        },
      },
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
      {
        path: 'garita',
        name: 'guardia-garita',
        component: () => import('@/modules/app-guardia/pages/GaritaPage.vue'),
        meta: { permiso: 'garita.registrar', titulo: 'Garita' },
      },
      {
        path: 'directorio',
        name: 'guardia-directorio',
        component: () => import('@/modules/app-guardia/pages/DirectorioPage.vue'),
        meta: { permiso: 'garita.directorio', titulo: 'Directorio' },
      },
      {
        path: 'paquetes',
        name: 'guardia-paquetes',
        component: () => import('@/modules/app-guardia/pages/PaquetesPage.vue'),
        meta: { permiso: 'paquetes.gestionar', titulo: 'Paquetes' },
      },
      {
        path: 'reservas-hoy',
        name: 'guardia-reservas-hoy',
        component: () => import('@/modules/app-guardia/pages/ReservasHoyPage.vue'),
        meta: { permiso: 'reservas.garita', titulo: 'Reservas de hoy' },
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
