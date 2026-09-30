// Datos de ejemplo del mockup F1AmenidadesCondominio.dc.html. Se reemplazan por la API cuando exista el endpoint.

/** rec: recreación · dep: deporte · soc: social · ser: servicios · seg: seguridad */
export type CategoriaAmenidad = 'rec' | 'dep' | 'soc' | 'ser' | 'seg';

export type OrigenAmenidad = 'cat' | 'prop';

export interface Amenidad {
  nombre: string;
  tipo: string;
  categoria: CategoriaAmenidad;
  origen: OrigenAmenidad;
  ubicacion: string;
  reservable: boolean;
  esencial: boolean;
  info: string;
  fotos: number;
  /** Texto del mantenimiento ("hasta 30 sep") o null si está disponible. */
  mantenimiento: string | null;
}

export interface TipoCatalogo {
  nombre: string;
  categoria: CategoriaAmenidad;
  reservable: boolean;
  esencial: boolean;
}

export const COLOR_CATEGORIA: Record<CategoriaAmenidad, string> = {
  rec: '#0E5E5B',
  dep: '#23407A',
  soc: '#B8641C',
  ser: '#5F5B52',
  seg: '#7A2E5A',
};

export const MANTENIMIENTO_HASTA = 'hasta 30 sep';

export const CATALOGO_AMENIDADES: TipoCatalogo[] = [
  { nombre: 'Piscina', categoria: 'rec', reservable: true, esencial: false },
  { nombre: 'Salón comunal', categoria: 'soc', reservable: true, esencial: false },
  { nombre: 'Área BBQ', categoria: 'soc', reservable: true, esencial: false },
  { nombre: 'Cancha múltiple', categoria: 'dep', reservable: true, esencial: false },
  { nombre: 'Gimnasio', categoria: 'dep', reservable: false, esencial: false },
  { nombre: 'Parque infantil', categoria: 'rec', reservable: false, esencial: false },
  { nombre: 'Ascensor', categoria: 'ser', reservable: false, esencial: true },
  { nombre: 'Generador eléctrico', categoria: 'ser', reservable: false, esencial: true },
  { nombre: 'Guardianía 24 h', categoria: 'seg', reservable: false, esencial: true },
  { nombre: 'Parqueadero de visitas', categoria: 'ser', reservable: false, esencial: true },
];

export const CATEGORIAS_PROPIAS = ['Recreación', 'Deporte', 'Social', 'Servicios', 'Seguridad'];

export const UBICACIONES_AMENIDAD = ['Área social', 'Torre A', 'Torre B', 'Torre C'];

export const AMENIDADES: Amenidad[] = [
  {
    nombre: 'Piscina',
    tipo: 'Piscina',
    categoria: 'rec',
    origen: 'cat',
    ubicacion: 'Área social',
    reservable: true,
    esencial: false,
    info: 'Capacidad 30 · reservas de 3 h',
    fotos: 4,
    mantenimiento: null,
  },
  {
    nombre: 'Salón comunal',
    tipo: 'Salón comunal',
    categoria: 'soc',
    origen: 'cat',
    ubicacion: 'Área social',
    reservable: true,
    esencial: false,
    info: 'Capacidad 80 · con aprobación',
    fotos: 3,
    mantenimiento: null,
  },
  {
    nombre: 'Área BBQ 1',
    tipo: 'Área BBQ',
    categoria: 'soc',
    origen: 'cat',
    ubicacion: 'Área social',
    reservable: true,
    esencial: false,
    info: 'Capacidad 20 · $ 15,00 por uso',
    fotos: 2,
    mantenimiento: null,
  },
  {
    nombre: 'Área BBQ 2',
    tipo: 'Área BBQ',
    categoria: 'soc',
    origen: 'cat',
    ubicacion: 'Junto a torre C',
    reservable: true,
    esencial: false,
    info: 'Capacidad 20 · $ 15,00 por uso',
    fotos: 2,
    mantenimiento: MANTENIMIENTO_HASTA,
  },
  {
    nombre: 'Gimnasio',
    tipo: 'Gimnasio',
    categoria: 'dep',
    origen: 'cat',
    ubicacion: 'Torre A · PB',
    reservable: false,
    esencial: false,
    info: 'Uso libre 06:00–22:00',
    fotos: 2,
    mantenimiento: null,
  },
  {
    nombre: 'Parque infantil',
    tipo: 'Parque infantil',
    categoria: 'rec',
    origen: 'cat',
    ubicacion: 'Área social',
    reservable: false,
    esencial: false,
    info: 'Uso libre',
    fotos: 1,
    mantenimiento: null,
  },
  {
    nombre: 'Ascensores (3)',
    tipo: 'Ascensor',
    categoria: 'ser',
    origen: 'cat',
    ubicacion: 'Torres A, B y C',
    reservable: false,
    esencial: true,
    info: 'Cantidad 3 · un solo registro',
    fotos: 0,
    mantenimiento: null,
  },
  {
    nombre: 'Guardianía 24 h',
    tipo: 'Guardianía 24 h',
    categoria: 'seg',
    origen: 'cat',
    ubicacion: 'Garita principal',
    reservable: false,
    esencial: true,
    info: 'Servicio permanente',
    fotos: 0,
    mantenimiento: null,
  },
  {
    nombre: 'Huerto comunitario',
    tipo: 'Propia del condominio',
    categoria: 'rec',
    origen: 'prop',
    ubicacion: 'Detrás de torre B',
    reservable: false,
    esencial: false,
    info: '12 parcelas por familia',
    fotos: 3,
    mantenimiento: null,
  },
];
