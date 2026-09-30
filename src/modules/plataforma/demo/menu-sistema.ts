// Datos de ejemplo del mockup F1PlataformaMenu.dc.html. Se reemplazan por la API cuando exista el endpoint.

export type AmbitoMenu = 'cond' | 'plat' | 'res';

export interface ItemMenuSistema {
  clave: string;
  /** i = ítem, g = grupo */
  tipo: 'i' | 'g';
  /** Clave del grupo al que pertenece (solo ítems dentro de un grupo). */
  grupo?: string;
  etiqueta: string;
  /** Material Symbols Rounded (sin prefijo). */
  icono: string;
  /** Nombre de la ruta en el manifiesto de rutas (solo ítems). */
  ruta?: string;
  permiso?: string;
  modulo: string;
  activo: boolean;
  /** De sistema: se edita, no se borra. */
  sistema: boolean;
}

function i(
  clave: string,
  etiqueta: string,
  icono: string,
  ruta: string,
  permiso: string,
  modulo: string,
  grupo?: string,
): ItemMenuSistema {
  return {
    clave,
    tipo: 'i',
    etiqueta,
    icono,
    ruta,
    permiso,
    modulo,
    activo: true,
    sistema: true,
    ...(grupo ? { grupo } : {}),
  };
}

function g(clave: string, etiqueta: string, icono: string, modulo: string): ItemMenuSistema {
  return { clave, tipo: 'g', etiqueta, icono, modulo, activo: true, sistema: true };
}

export const AMBITOS_MENU: { valor: AmbitoMenu; etiqueta: string }[] = [
  { valor: 'cond', etiqueta: 'Condominio (web)' },
  { valor: 'plat', etiqueta: 'Plataforma' },
  { valor: 'res', etiqueta: 'App del residente' },
];

export const MENU_SISTEMA: Record<AmbitoMenu, ItemMenuSistema[]> = {
  cond: [
    i('inicio', 'Inicio', 'home', 'inicio', '', ''),
    i('unidades', 'Unidades', 'apartment', 'unidades.index', 'unidades.ver', 'Núcleo'),
    g('g-fin', 'FINANZAS', 'account_balance_wallet', 'Finanzas'),
    i('resumen', 'Resumen', 'dashboard', 'finanzas.resumen', 'finanzas.ver', 'Finanzas', 'g-fin'),
    i(
      'pagos',
      'Pagos de residentes',
      'fact_check',
      'finanzas.pagos',
      'pagos.aprobar',
      'Finanzas',
      'g-fin',
    ),
    i(
      'cxp',
      'Cuentas por pagar',
      'request_quote',
      'finanzas.cuentas-por-pagar',
      'gastos.registrar',
      'Finanzas',
      'g-fin',
    ),
    i(
      'conc',
      'Conciliación bancaria',
      'account_balance',
      'finanzas.conciliacion',
      'conciliacion.gestionar',
      'Conciliación automática',
      'g-fin',
    ),
    i('rep', 'Reportes', 'bar_chart', 'finanzas.reportes', 'finanzas.ver', 'Finanzas', 'g-fin'),
    i(
      'areas',
      'Áreas comunes',
      'event_available',
      'reservas.agenda',
      'reservas.ver',
      'Áreas comunes',
    ),
    i('garita', 'Garita', 'badge', 'garita.bitacora', 'visitas.registrar', 'Garita'),
    i('asam', 'Asambleas', 'how_to_vote', 'asambleas.index', 'asambleas.preparar', 'Asambleas'),
    g('g-conf', 'CONFIGURACIÓN', 'settings', ''),
    i('amen', 'Amenidades', 'pool', 'amenidades.index', 'amenidades.gestionar', 'Núcleo', 'g-conf'),
    i(
      'usu',
      'Usuarios y roles',
      'manage_accounts',
      'usuarios.index',
      'usuarios.gestionar',
      'Núcleo',
      'g-conf',
    ),
    i(
      'sus',
      'Mi suscripción',
      'card_membership',
      'suscripcion.mia',
      'suscripcion.ver',
      'Núcleo',
      'g-conf',
    ),
  ],
  plat: [
    i('cobranza', 'Cobranza', 'savings', 'plataforma.cobranza', '', ''),
    i('condominios', 'Condominios', 'domain', 'plataforma.condominios', '', ''),
    i('planes', 'Planes y módulos', 'inventory_2', 'plataforma.planes', '', ''),
    i('catalogo', 'Catálogo de amenidades', 'pool', 'plataforma.amenidades', '', ''),
    g('g-acceso', 'ACCESO', 'shield_person', ''),
    i('roles', 'Roles y permisos', 'shield_person', 'plataforma.roles', '', '', 'g-acceso'),
    i('menu', 'Menú del sistema', 'tune', 'plataforma.menu', '', '', 'g-acceso'),
    i('config', 'Configuración', 'settings', 'plataforma.configuracion', '', ''),
  ],
  res: [
    i('hogar', 'Mi hogar', 'home', 'app.mi-hogar', '', 'Núcleo'),
    i('cuenta', 'Mi cuenta', 'receipt_long', 'app.mi-cuenta', 'finanzas.ver', 'Finanzas'),
    i('reservar', 'Reservar', 'event_available', 'app.reservar', 'reservas.ver', 'Áreas comunes'),
    i('visitas', 'Visitas', 'badge', 'app.visitas', 'visitas.registrar', 'Garita'),
    i('anuncios', 'Anuncios', 'campaign', 'app.anuncios', '', 'Comunicación'),
    i('asamblea', 'Asamblea', 'how_to_vote', 'app.asamblea', '', 'Asambleas'),
  ],
};

/** Ítem seleccionado al abrir cada pestaña (el mockup abre "Resumen"). */
export const SELECCION_INICIAL: Record<AmbitoMenu, number> = { cond: 3, plat: 0, res: 0 };

export const ICONOS_MENU = [
  'home',
  'apartment',
  'group',
  'dashboard',
  'fact_check',
  'request_quote',
  'account_balance',
  'bar_chart',
  'event_available',
  'badge',
  'how_to_vote',
  'pool',
  'manage_accounts',
  'card_membership',
  'campaign',
  'report',
  'inventory_2',
  'savings',
  'storefront',
  'receipt_long',
  'tune',
  'settings',
  'domain',
  'shield_person',
];

export interface RolVistaPrevia {
  valor: string;
  etiqueta: string;
  /** '*' = todos los permisos. */
  permisos: '*' | string[];
  /** Módulos que incluye el plan del condominio. */
  modulos: string[];
}

const MODULOS_PROFESIONAL = ['Núcleo', 'Finanzas', 'Áreas comunes', 'Garita', 'Comunicación'];

export const ROLES_VISTA_PREVIA: RolVistaPrevia[] = [
  {
    valor: 'admin',
    etiqueta: 'Administrador · Profesional',
    permisos: '*',
    modulos: MODULOS_PROFESIONAL,
  },
  {
    valor: 'tes',
    etiqueta: 'Tesorero · Profesional',
    permisos: [
      'unidades.ver',
      'finanzas.ver',
      'pagos.aprobar',
      'gastos.registrar',
      'conciliacion.gestionar',
    ],
    modulos: MODULOS_PROFESIONAL,
  },
  {
    valor: 'cont',
    etiqueta: 'Contador · Profesional',
    permisos: ['finanzas.ver'],
    modulos: MODULOS_PROFESIONAL,
  },
  {
    valor: 'guar',
    etiqueta: 'Guardia · Profesional',
    permisos: ['visitas.registrar', 'reservas.ver'],
    modulos: MODULOS_PROFESIONAL,
  },
  {
    valor: 'adminC',
    etiqueta: 'Administrador · Completo',
    permisos: '*',
    modulos: [...MODULOS_PROFESIONAL, 'Conciliación automática', 'Asambleas'],
  },
];
