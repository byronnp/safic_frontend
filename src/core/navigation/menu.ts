import { ICONOS } from './icons';

/**
 * Ítem del menú. Mismo formato que GET /me/menu y GET /plataforma/me/menu
 * (menú por perfil, administrable por el super admin). Los menús de este
 * archivo solo aportan, en desarrollo, las pantallas en vista previa
 * (ver combinarConVistasPrevias) y los menús de las apps móviles.
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
      },
      {
        id: 'configuracion.cobro',
        etiqueta: 'Cobro de cuotas',
        icono: ICONOS.cobroCuotas,
        ruta: 'configuracion-cobro',
        permiso: 'condominio.editar',
      },
      {
        id: 'configuracion.amenidades',
        etiqueta: 'Amenidades',
        icono: ICONOS.amenidades,
        ruta: 'configuracion-amenidades',
        permiso: 'amenidades.gestionar',
      },
      {
        id: 'configuracion.usuarios',
        etiqueta: 'Usuarios',
        icono: ICONOS.usuarios,
        ruta: 'configuracion-usuarios',
        permiso: 'usuarios.gestionar',
      },
      {
        id: 'configuracion.roles',
        etiqueta: 'Roles',
        icono: ICONOS.roles,
        ruta: 'configuracion-roles',
        permiso: 'usuarios.gestionar',
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
    permiso: 'garita.directorio',
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
/**
 * Módulo (ítem con hijos, no sección fija) que contiene la pantalla actual.
 * Ese módulo se muestra desplegado en el menú lateral.
 */
export function moduloDeRuta(items: readonly ItemMenu[], ruta: string | undefined): string | null {
  if (!ruta) {
    return null;
  }
  const modulo = items.find(
    (item) => !item.seccion && item.hijos?.some((hijo) => hijo.ruta === ruta),
  );
  return modulo?.id ?? null;
}

/** Íconos aceptados desde la API: solo Material Symbols Rounded (nunca `img:` u otra URL). */
const ICONO_VALIDO = /^sym_r_[a-z0-9_]+$/;

/**
 * Limpia el menú que llega de la API antes de pintarlo:
 * - un ícono que no es `sym_r_*` se cambia por uno genérico;
 * - una hoja cuya ruta no existe en esta versión del frontend se descarta
 *   (vue-router fallaría al pintar el enlace);
 * - un grupo que queda sin hojas se descarta.
 */
export function normalizarMenu(
  items: readonly ItemMenu[],
  existeRuta: (nombre: string) => boolean,
): ItemMenu[] {
  const resultado: ItemMenu[] = [];

  for (const item of items) {
    const icono = ICONO_VALIDO.test(item.icono) ? item.icono : ICONOS.vacio;

    if (item.hijos) {
      const hijos = normalizarMenu(item.hijos, existeRuta);
      if (hijos.length > 0) {
        resultado.push({ ...item, icono, hijos });
      }
    } else if (item.ruta && existeRuta(item.ruta)) {
      resultado.push({ ...item, icono });
    }
  }

  return resultado;
}

/**
 * Perfiles que en producción tendrán todos los permisos de su ámbito
 * (Rol::permisosPorDefecto del backend): ven todas las vistas previas.
 */
export const ROL_ACCESO_TOTAL_CONDOMINIO = 'administrador';
export const ROL_ACCESO_TOTAL_PLATAFORMA = 'super_admin';

/** Lo que hace falta saber del usuario para mostrarle una vista previa. */
export interface AccesoVistaPrevia {
  /** Perfil que en producción tendrá todos los permisos del ámbito (administrador, super admin). */
  accesoTotal: boolean;
  tienePermiso: (permiso: string) => boolean;
}

/**
 * ¿El usuario vería esta pantalla en vista previa? Las vistas previas no tienen
 * datos reales, pero se muestran como las verá cada perfil: con su permiso, o a
 * quien tendrá acceso total. Una pantalla sin permiso declarado solo la ve el
 * acceso total (así un residente no ve el menú de la administración).
 */
export function puedeVerVistaPrevia(
  permiso: string | undefined,
  acceso: AccesoVistaPrevia,
): boolean {
  return acceso.accesoTotal || (permiso !== undefined && acceso.tienePermiso(permiso));
}

/** Permiso del ítem del menú que lleva a una ruta (para las rutas en vista previa). */
export function permisoDeRuta(items: readonly ItemMenu[], ruta: string): string | undefined {
  for (const item of items) {
    if (item.ruta === ruta) {
      return item.permiso;
    }
    const enHijos = item.hijos ? permisoDeRuta(item.hijos, ruta) : undefined;
    if (enHijos !== undefined) {
      return enHijos;
    }
  }
  return undefined;
}

/**
 * Menú de la API + pantallas en vista previa del menú local (solo desarrollo).
 * - El orden lo da el menú local; lo que la API trae y el local no conoce va al final.
 * - De la API se respeta todo (ya viene filtrado por perfil y permisos).
 * - Del local solo se agregan hojas con `vistaPrevia` (sin datos reales) que el
 *   perfil vería (`puedeVer`, ver puedeVerVistaPrevia).
 */
export function combinarConVistasPrevias(
  deApi: readonly ItemMenu[],
  local: readonly ItemMenu[],
  puedeVer: (item: ItemMenu) => boolean = () => true,
): ItemMenu[] {
  const porId = new Map(deApi.map((item) => [item.id, item]));
  const resultado: ItemMenu[] = [];

  for (const item of local) {
    const remoto = porId.get(item.id);
    porId.delete(item.id);

    if (item.hijos) {
      const hijos = combinarConVistasPrevias(remoto?.hijos ?? [], item.hijos, puedeVer);
      if (hijos.length > 0) {
        resultado.push({ ...(remoto ?? item), hijos });
      }
    } else if (remoto) {
      resultado.push(remoto);
    } else if (item.vistaPrevia && puedeVer(item)) {
      resultado.push(item);
    }
  }

  return [...resultado, ...porId.values()];
}

/** Primera pantalla del menú (ya filtrado) a la que puede entrar el usuario. */
export function primeraRuta(items: readonly ItemMenu[]): string | null {
  for (const item of items) {
    if (item.ruta) {
      return item.ruta;
    }
    const enHijos = item.hijos ? primeraRuta(item.hijos) : null;
    if (enHijos) {
      return enHijos;
    }
  }
  return null;
}

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
