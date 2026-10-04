// Datos de ejemplo del mockup F1Asistente.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface PasoAsistente {
  titulo: string;
  sub: string;
}

export const PASOS_NUEVO_CONDOMINIO: PasoAsistente[] = [
  { titulo: 'Datos generales', sub: 'Contrato y legales' },
  { titulo: 'Ubicación', sub: 'Pin en el mapa' },
  { titulo: 'Amenidades', sub: 'Del catálogo' },
  { titulo: 'Administrador', sub: 'Invitación' },
];

/**
 * Amenidades marcadas al abrir el asistente (claves del catálogo global).
 * Planes, tipos, ubicaciones y amenidades vienen de la API (/plataforma/*).
 */
export const AMENIDADES_INICIALES = [
  'piscina',
  'gimnasio',
  'salon_comunal',
  'area_bbq',
  'parque_infantil',
  'guardiania',
  'generador',
];

export interface FormularioNuevoCondominio {
  nombre: string;
  /** Valor del tipo (GET /plataforma/catalogos). */
  tipo: string;
  ruc: string;
  razonSocial: string;
  /** Códigos INEC (GET /plataforma/ubicaciones). */
  provincia: string;
  canton: string;
  parroquia: string;
  direccion: string;
  contacto: string;
  unidades: number | null;
  /** Clave del plan (GET /plataforma/planes). */
  plan: string;
  valorUnidad: number | null;
  buscarDireccion: string;
  latitud: string;
  longitud: string;
  cedula: string;
  nombreAdmin: string;
  correo: string;
  celular: string;
}

export const FORMULARIO_INICIAL: FormularioNuevoCondominio = {
  nombre: 'Conjunto Los Arupos',
  tipo: 'conjunto',
  ruc: '1792456781001',
  razonSocial: 'Conjunto Habitacional Los Arupos',
  provincia: '17',
  canton: '',
  parroquia: '',
  direccion: 'Av. Ilaló y calle Los Arupos',
  contacto: '02 234 5678 · admin@losarupos.ec',
  unidades: 130,
  plan: 'profesional',
  valorUnidad: 2,
  buscarDireccion: 'Av. Ilaló, Conocoto',
  latitud: '-0.285412',
  longitud: '-78.471236',
  cedula: '1712345678',
  nombreAdmin: 'María Rivas',
  correo: 'maria.rivas@jardinesdelvalle.ec',
  celular: '099 412 7788',
};

/** Personas que ya tienen cuenta en SAFIC (por cédula) y qué condominio administran. */
export const CUENTAS_EXISTENTES: Record<string, string> = {
  '1712345678': 'Jardines del Valle',
};
