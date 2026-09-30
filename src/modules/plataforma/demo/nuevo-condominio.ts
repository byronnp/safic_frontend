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

export const TIPOS_CONDOMINIO = ['Conjunto', 'Edificio', 'Urbanización', 'Mixto'] as const;

export type CodigoPlan = 'b' | 'p' | 'c';

export const PLANES_ASISTENTE: { valor: CodigoPlan; etiqueta: string }[] = [
  { valor: 'b', etiqueta: 'Básico' },
  { valor: 'p', etiqueta: 'Profesional' },
  { valor: 'c', etiqueta: 'Completo' },
];

/** Provincia → cantón → parroquias (muestra reducida para la vista previa). */
export const UBICACIONES: Record<string, Record<string, string[]>> = {
  Pichincha: {
    Quito: ['Conocoto', 'Cumbayá', 'Tumbaco', 'Calderón', 'Pomasqui'],
    Rumiñahui: ['Sangolquí', 'San Rafael'],
  },
  Guayas: {
    Samborondón: ['La Puntilla', 'Samborondón'],
    Guayaquil: ['Tarqui', 'Ximena'],
  },
  Azuay: { Cuenca: ['El Batán', 'Yanuncay'] },
  'Santa Elena': { Salinas: ['Salinas', 'José Luis Tamayo'] },
};

export interface AmenidadAsistente {
  nombre: string;
  meta: string;
  cantidad: number;
}

export const AMENIDADES_ASISTENTE: AmenidadAsistente[] = [
  { nombre: 'Piscina', meta: 'Reservable · no esencial', cantidad: 1 },
  { nombre: 'Gimnasio', meta: 'Acceso libre', cantidad: 1 },
  { nombre: 'Salón comunal', meta: 'Reservable', cantidad: 1 },
  { nombre: 'Área BBQ', meta: 'Reservable', cantidad: 2 },
  { nombre: 'Canchas', meta: 'Reservable', cantidad: 1 },
  { nombre: 'Parque infantil', meta: 'Acceso libre', cantidad: 1 },
  { nombre: 'Guardianía 24 h', meta: 'Esencial', cantidad: 1 },
  { nombre: 'Generador', meta: 'Esencial', cantidad: 1 },
  { nombre: 'Parqueadero de visitas', meta: 'Acceso libre', cantidad: 12 },
];

/** Índices de AMENIDADES_ASISTENTE marcados al abrir el asistente. */
export const AMENIDADES_MARCADAS = [0, 1, 2, 3, 5, 6, 7];

export interface FormularioNuevoCondominio {
  nombre: string;
  tipo: string;
  ruc: string;
  razonSocial: string;
  provincia: string;
  canton: string;
  parroquia: string;
  direccion: string;
  contacto: string;
  unidades: number | null;
  plan: CodigoPlan;
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
  tipo: 'Conjunto',
  ruc: '1792456781001',
  razonSocial: 'Conjunto Habitacional Los Arupos',
  provincia: 'Pichincha',
  canton: 'Quito',
  parroquia: 'Conocoto',
  direccion: 'Av. Ilaló y calle Los Arupos',
  contacto: '02 234 5678 · admin@losarupos.ec',
  unidades: 130,
  plan: 'p',
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
