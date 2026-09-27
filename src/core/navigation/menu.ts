import { ICONOS } from './icons';

/**
 * Ítem del menú. Mismo formato que devolverá GET /me/menu (menú administrable
 * por el super admin). Mientras ese endpoint no exista, se usan los menús de
 * este archivo filtrados por los permisos del condominio activo.
 *
 * Estructura (igual que en los mockups):
 * - Ítem con `ruta`: enlace directo (Inicio).
 * - Módulo con `hijos`: en el menú se ve como un solo enlace; cuando la
 *   pantalla actual es de ese módulo, se despliega como sección con sus hijos.
 * - `seccion: true`: grupo siempre desplegado (CONFIGURACIÓN, ACCESO).
 */
export interface ItemMenu {
  id: string;
  etiqueta: string;
  /** Obligatorio: Material Symbols Rounded (sym_r_*). */
  icono: string;
  /** Nombre de la ruta de vue-router. Los grupos no tienen ruta. */
  ruta?: string;
  /** Permiso requerido; si falta, lo ve cualquier usuario con sesión. */
  permiso?: string;
  hijos?: ItemMenu[];
  seccion?: boolean;
  /** Pantalla con diseño pero sin API todavía (ver core/vista-previa.ts). */
  vistaPrevia?: boolean;
  /** Contador junto a la etiqueta (ej. pagos por aprobar). */
  insignia?: number;
}

/** Menú del condominio (administración y directiva). */
export const MENU_BASE: ItemMenu[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: ICONOS.inicio, ruta: 'inicio' },
  {
    id: 'unidades',
    etiqueta: 'Unidades',
    icono: ICONOS.unidades,
    hijos: [
      {
        id: 'unidades.lista',
        etiqueta: 'Unidades',
        icono: ICONOS.unidades,
        ruta: 'unidades',
        permiso: 'unidades.ver',
        vistaPrevia: true,
      },
      {
        id: 'unidades.bloques',
        etiqueta: 'Bloques',
        icono: ICONOS.bloques,
        ruta: 'bloques',
        permiso: 'unidades.ver',
      },
    ],
  },
  {
    id: 'finanzas',
    etiqueta: 'Finanzas',
    icono: ICONOS.finanzas,
    hijos: [
      {
        id: 'finanzas.resumen',
        etiqueta: 'Resumen',
        icono: ICONOS.resumen,
        ruta: 'finanzas-resumen',
        permiso: 'finanzas.ver',
        vistaPrevia: true,
      },
      {
        id: 'finanzas.pagos',
        etiqueta: 'Pagos por aprobar',
        icono: ICONOS.pagosPorAprobar,
        ruta: 'finanzas-pagos-por-aprobar',
        permiso: 'pagos.aprobar',
        vistaPrevia: true,
        insignia: 7,
      },
      {
        id: 'finanzas.conciliacion',
        etiqueta: 'Conciliación bancaria',
        icono: ICONOS.conciliacion,
        ruta: 'finanzas-conciliacion',
        permiso: 'pagos.aprobar',
        vistaPrevia: true,
      },
      {
        id: 'finanzas.cuentas',
        etiqueta: 'Cuentas por pagar',
        icono: ICONOS.cuentasPorPagar,
        ruta: 'finanzas-cuentas-por-pagar',
        permiso: 'gastos.registrar',
        vistaPrevia: true,
      },
    ],
  },
  {
    id: 'areas',
    etiqueta: 'Áreas comunes',
    icono: ICONOS.reservas,
    hijos: [
      {
        id: 'areas.agenda',
        etiqueta: 'Agenda',
        icono: ICONOS.agenda,
        ruta: 'areas-agenda',
        permiso: 'reservas.ver',
        vistaPrevia: true,
      },
      {
        id: 'areas.reglas',
        etiqueta: 'Áreas y reglas',
        icono: ICONOS.areasReglas,
        ruta: 'areas-reglas',
        permiso: 'reservas.gestionar',
        vistaPrevia: true,
      },
    ],
  },
  {
    id: 'comunicacion',
    etiqueta: 'Seguridad y comunicación',
    icono: ICONOS.garita,
    hijos: [
      {
        id: 'comunicacion.anuncios',
        etiqueta: 'Anuncios',
        icono: ICONOS.anuncios,
        ruta: 'comunicacion-anuncios',
        permiso: 'anuncios.publicar',
        vistaPrevia: true,
      },
      {
        id: 'comunicacion.incidencias',
        etiqueta: 'Incidencias',
        icono: ICONOS.incidencias,
        ruta: 'comunicacion-incidencias',
        permiso: 'incidencias.gestionar',
        vistaPrevia: true,
      },
    ],
  },
  {
    id: 'asambleas',
    etiqueta: 'Asambleas',
    icono: ICONOS.asambleas,
    hijos: [
      {
        id: 'asambleas.preparar',
        etiqueta: 'Preparar asamblea',
        icono: ICONOS.prepararAsamblea,
        ruta: 'asambleas-preparar',
        permiso: 'asambleas.preparar',
        vistaPrevia: true,
      },
      {
        id: 'asambleas.mesa',
        etiqueta: 'Mesa de la asamblea',
        icono: ICONOS.mesaAsamblea,
        ruta: 'asambleas-mesa',
        permiso: 'asambleas.instalar',
        vistaPrevia: true,
      },
    ],
  },
  {
    id: 'configuracion',
    etiqueta: 'Configuración',
    icono: ICONOS.configuracion,
    seccion: true,
    hijos: [
      {
        id: 'configuracion.condominio',
        etiqueta: 'Datos del condominio',
        icono: ICONOS.datosCondominio,
        ruta: 'configuracion-condominio',
        permiso: 'condominio.editar',
        vistaPrevia: true,
      },
      {
        id: 'configuracion.amenidades',
        etiqueta: 'Amenidades',
        icono: ICONOS.amenidades,
        ruta: 'configuracion-amenidades',
        permiso: 'amenidades.gestionar',
        vistaPrevia: true,
      },
      {
        id: 'configuracion.usuarios',
        etiqueta: 'Usuarios',
        icono: ICONOS.usuarios,
        ruta: 'configuracion-usuarios',
        permiso: 'usuarios.gestionar',
        vistaPrevia: true,
      },
      {
        id: 'configuracion.roles',
        etiqueta: 'Roles',
        icono: ICONOS.roles,
        ruta: 'configuracion-roles',
        permiso: 'usuarios.gestionar',
        vistaPrevia: true,
      },
      {
        id: 'configuracion.suscripcion',
        etiqueta: 'Mi suscripción',
        icono: ICONOS.suscripcion,
        ruta: 'configuracion-suscripcion',
        permiso: 'condominio.editar',
        vistaPrevia: true,
      },
    ],
  },
];

/** Menú del panel de plataforma (super admin). */
export const MENU_PLATAFORMA: ItemMenu[] = [
  {
    id: 'plataforma.cobranza',
    etiqueta: 'Cobranza',
    icono: ICONOS.cobranza,
    ruta: 'plataforma-cobranza',
    permiso: 'plataforma.cobranza',
    vistaPrevia: true,
  },
  {
    id: 'plataforma.condominios',
    etiqueta: 'Condominios',
    icono: ICONOS.condominios,
    ruta: 'plataforma-condominios',
    permiso: 'plataforma.condominios',
    vistaPrevia: true,
  },
  {
    id: 'plataforma.planes',
    etiqueta: 'Planes y módulos',
    icono: ICONOS.planes,
    ruta: 'plataforma-planes',
    permiso: 'plataforma.cobranza',
    vistaPrevia: true,
  },
  {
    id: 'plataforma.amenidades',
    etiqueta: 'Catálogo de amenidades',
    icono: ICONOS.catalogo,
    ruta: 'plataforma-amenidades',
    permiso: 'plataforma.condominios',
    vistaPrevia: true,
  },
  {
    id: 'plataforma.acceso',
    etiqueta: 'Acceso',
    icono: ICONOS.bloqueado,
    seccion: true,
    hijos: [
      {
        id: 'plataforma.roles',
        etiqueta: 'Roles y permisos',
        icono: ICONOS.roles,
        ruta: 'plataforma-roles',
        permiso: 'plataforma.roles',
        vistaPrevia: true,
      },
      {
        id: 'plataforma.menu',
        etiqueta: 'Menú del sistema',
        icono: ICONOS.menuSistema,
        ruta: 'plataforma-menu',
        permiso: 'plataforma.roles',
        vistaPrevia: true,
      },
      {
        id: 'plataforma.configuracion',
        etiqueta: 'Configuración',
        icono: ICONOS.configuracion,
        ruta: 'plataforma-configuracion',
        permiso: 'plataforma.cobranza',
        vistaPrevia: true,
      },
    ],
  },
];

/** Pestañas inferiores de la app del residente. */
export const MENU_APP_RESIDENTE: ItemMenu[] = [
  {
    id: 'app.hogar',
    etiqueta: 'Mi hogar',
    icono: ICONOS.miHogar,
    ruta: 'app-mi-hogar',
    vistaPrevia: true,
  },
  {
    id: 'app.cuenta',
    etiqueta: 'Pagos',
    icono: ICONOS.pagosApp,
    ruta: 'app-mi-cuenta',
    vistaPrevia: true,
  },
  {
    id: 'app.reservas',
    etiqueta: 'Reservas',
    icono: ICONOS.reservasHoy,
    ruta: 'app-reservar',
    vistaPrevia: true,
  },
  {
    id: 'app.visitas',
    etiqueta: 'Visitas',
    icono: ICONOS.visitas,
    ruta: 'app-nueva-visita',
    vistaPrevia: true,
  },
  {
    id: 'app.asamblea',
    etiqueta: 'Asamblea',
    icono: ICONOS.asamblea,
    ruta: 'app-asamblea',
    vistaPrevia: true,
  },
];

/** Pestañas inferiores de la app del guardia. */
export const MENU_APP_GUARDIA: ItemMenu[] = [
  {
    id: 'guardia.garita',
    etiqueta: 'Garita',
    icono: ICONOS.garitaApp,
    ruta: 'guardia-garita',
    vistaPrevia: true,
  },
  {
    id: 'guardia.directorio',
    etiqueta: 'Directorio',
    icono: ICONOS.directorio,
    ruta: 'guardia-directorio',
    vistaPrevia: true,
  },
  {
    id: 'guardia.reservas',
    etiqueta: 'Reservas hoy',
    icono: ICONOS.reservasHoy,
    ruta: 'guardia-reservas-hoy',
    vistaPrevia: true,
  },
];

export interface OpcionesFiltro {
  /** Mostrar pantallas en vista previa aunque falte el permiso (solo desarrollo). */
  vistasPrevias?: boolean;
}

/**
 * Deja solo los ítems permitidos. Un grupo sin hijos visibles desaparece.
 * Ocultar un ítem NO es seguridad: cada ruta de la API exige su permiso.
 */
export function filtrarMenu(
  items: ItemMenu[],
  permisos: readonly string[],
  opciones: OpcionesFiltro = {},
): ItemMenu[] {
  const resultado: ItemMenu[] = [];

  for (const item of items) {
    if (item.vistaPrevia) {
      if (!opciones.vistasPrevias) {
        continue;
      }
    } else if (item.permiso && !permisos.includes(item.permiso)) {
      continue;
    }

    if (item.hijos) {
      const hijos = filtrarMenu(item.hijos, permisos, opciones);
      if (hijos.length === 0) {
        continue;
      }
      resultado.push({ ...item, hijos });
      continue;
    }

    resultado.push(item);
  }

  return resultado;
}

/** Hojas del menú (ítems con ruta), en orden. */
export function hojasMenu(items: ItemMenu[]): ItemMenu[] {
  return items.flatMap((item) => (item.hijos ? hojasMenu(item.hijos) : item.ruta ? [item] : []));
}
