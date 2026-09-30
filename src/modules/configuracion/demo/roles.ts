// Datos de ejemplo del mockup F1RolesCondominio.dc.html. Se reemplazan por la API cuando exista el endpoint.

/** Módulos incluidos en el plan del condominio (Profesional). */
export const MODULOS_DEL_PLAN = ['Núcleo', 'Finanzas', 'Áreas comunes', 'Garita', 'Comunicación'];

export interface PermisoDemo {
  clave: string;
  texto: string;
  modulo: string;
  /** Hace que el rol sea administrativo (cuenta para el cupo del plan). */
  administrativo: boolean;
}

export const PERMISOS: PermisoDemo[] = [
  {
    clave: 'unidades.ver',
    texto: 'Ver unidades y residentes',
    modulo: 'Núcleo',
    administrativo: false,
  },
  {
    clave: 'unidades.editar',
    texto: 'Crear y editar unidades',
    modulo: 'Núcleo',
    administrativo: true,
  },
  {
    clave: 'residentes.ver_datos',
    texto: 'Ver datos personales completos',
    modulo: 'Núcleo',
    administrativo: true,
  },
  {
    clave: 'amenidades.gestionar',
    texto: 'Gestionar amenidades',
    modulo: 'Núcleo',
    administrativo: true,
  },
  {
    clave: 'finanzas.ver',
    texto: 'Ver finanzas y reportes',
    modulo: 'Finanzas',
    administrativo: false,
  },
  {
    clave: 'pagos.aprobar',
    texto: 'Aprobar pagos de residentes',
    modulo: 'Finanzas',
    administrativo: true,
  },
  {
    clave: 'gastos.registrar',
    texto: 'Registrar facturas de proveedores',
    modulo: 'Finanzas',
    administrativo: true,
  },
  {
    clave: 'finanzas.exportar',
    texto: 'Exportar a Excel y PDF',
    modulo: 'Finanzas',
    administrativo: true,
  },
  {
    clave: 'reservas.ver',
    texto: 'Ver agenda de áreas',
    modulo: 'Áreas comunes',
    administrativo: false,
  },
  {
    clave: 'reservas.gestionar',
    texto: 'Aprobar y gestionar reservas',
    modulo: 'Áreas comunes',
    administrativo: true,
  },
  {
    clave: 'visitas.registrar',
    texto: 'Registrar visitas y paquetes',
    modulo: 'Garita',
    administrativo: false,
  },
  {
    clave: 'anuncios.publicar',
    texto: 'Publicar anuncios',
    modulo: 'Comunicación',
    administrativo: false,
  },
  {
    clave: 'incidencias.gestionar',
    texto: 'Gestionar incidencias',
    modulo: 'Comunicación',
    administrativo: false,
  },
  {
    clave: 'conciliacion.importar',
    texto: 'Importar estados de cuenta',
    modulo: 'Conciliación automática',
    administrativo: true,
  },
  {
    clave: 'asambleas.preparar',
    texto: 'Preparar y convocar asambleas',
    modulo: 'Asambleas',
    administrativo: false,
  },
];

export type TipoRol = 'sistema' | 'cargo' | 'adicional';

export interface RolDemo {
  clave: string;
  nombre: string;
  tipo: TipoRol;
  usuarios: number;
  /** Nombre del ícono Material Symbols Rounded (sin prefijo). */
  icono: string;
  permisos: string[];
}

export interface GrupoRoles {
  titulo: string;
  roles: RolDemo[];
}

export const GRUPOS_ROLES: GrupoRoles[] = [
  {
    titulo: 'SISTEMA',
    roles: [
      {
        clave: 'admin',
        nombre: 'Administrador',
        tipo: 'sistema',
        usuarios: 1,
        icono: 'shield',
        permisos: [
          'unidades.ver',
          'unidades.editar',
          'residentes.ver_datos',
          'amenidades.gestionar',
          'finanzas.ver',
          'pagos.aprobar',
          'gastos.registrar',
          'finanzas.exportar',
          'reservas.ver',
          'reservas.gestionar',
          'visitas.registrar',
          'anuncios.publicar',
          'incidencias.gestionar',
        ],
      },
      {
        clave: 'contador',
        nombre: 'Contador',
        tipo: 'sistema',
        usuarios: 1,
        icono: 'calculate',
        permisos: ['finanzas.ver', 'finanzas.exportar'],
      },
      {
        clave: 'guardia',
        nombre: 'Guardia',
        tipo: 'sistema',
        usuarios: 3,
        icono: 'badge',
        permisos: ['visitas.registrar', 'reservas.ver'],
      },
      {
        clave: 'mant',
        nombre: 'Mantenimiento',
        tipo: 'sistema',
        usuarios: 1,
        icono: 'build',
        permisos: ['incidencias.gestionar'],
      },
      {
        clave: 'residente',
        nombre: 'Residente',
        tipo: 'sistema',
        usuarios: 146,
        icono: 'home',
        permisos: ['reservas.ver'],
      },
    ],
  },
  {
    titulo: 'CARGOS DE DIRECTIVA',
    roles: [
      {
        clave: 'pres',
        nombre: 'Presidente',
        tipo: 'cargo',
        usuarios: 1,
        icono: 'workspace_premium',
        permisos: [
          'unidades.ver',
          'finanzas.ver',
          'reservas.ver',
          'anuncios.publicar',
          'asambleas.preparar',
        ],
      },
      {
        clave: 'vice',
        nombre: 'Vicepresidente',
        tipo: 'cargo',
        usuarios: 1,
        icono: 'workspace_premium',
        permisos: [
          'unidades.ver',
          'finanzas.ver',
          'reservas.ver',
          'anuncios.publicar',
          'asambleas.preparar',
        ],
      },
      {
        clave: 'sec',
        nombre: 'Secretario',
        tipo: 'cargo',
        usuarios: 1,
        icono: 'edit_note',
        permisos: ['unidades.ver'],
      },
      {
        clave: 'tes',
        nombre: 'Tesorero',
        tipo: 'cargo',
        usuarios: 1,
        icono: 'savings',
        permisos: [
          'unidades.ver',
          'finanzas.ver',
          'pagos.aprobar',
          'gastos.registrar',
          'finanzas.exportar',
        ],
      },
    ],
  },
  {
    titulo: 'ADICIONALES DE LA PLATAFORMA',
    roles: [
      {
        clave: 'asis',
        nombre: 'Asistente contable',
        tipo: 'adicional',
        usuarios: 0,
        icono: 'person',
        permisos: ['unidades.ver', 'finanzas.ver', 'gastos.registrar'],
      },
      {
        clave: 'conserje',
        nombre: 'Conserje',
        tipo: 'adicional',
        usuarios: 2,
        icono: 'person',
        permisos: ['reservas.ver', 'incidencias.gestionar', 'anuncios.publicar'],
      },
    ],
  },
];

/** Rol elegido al abrir la pantalla. */
export const ROL_INICIAL = 'asis';

/** Pantallas del menú lateral y el permiso que las muestra. */
export const MENU_POR_PERMISO: { permiso: string; texto: string; icono: string }[] = [
  { permiso: 'unidades.ver', texto: 'Unidades', icono: 'apartment' },
  { permiso: 'finanzas.ver', texto: 'Finanzas', icono: 'account_balance_wallet' },
  { permiso: 'gastos.registrar', texto: 'Cuentas por pagar', icono: 'request_quote' },
  { permiso: 'reservas.ver', texto: 'Áreas comunes', icono: 'event_available' },
  { permiso: 'visitas.registrar', texto: 'Garita', icono: 'badge' },
  { permiso: 'anuncios.publicar', texto: 'Anuncios', icono: 'campaign' },
  { permiso: 'incidencias.gestionar', texto: 'Incidencias', icono: 'report' },
  { permiso: 'amenidades.gestionar', texto: 'Amenidades', icono: 'pool' },
];

export const CUPO_ROLES = { usados: 3, limite: 3 } as const;

export const NOMBRE_CONDOMINIO_CORTO = 'Jardines del Valle';

/** Valores de ejemplo del formulario "Solicitar rol". */
export const SOLICITUD_EJEMPLO = {
  nombre: 'Jardinero',
  descripcion: 'Ver la agenda de áreas y reportar incidencias de áreas verdes',
} as const;
