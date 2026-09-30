// Datos de ejemplo del mockup Platform.dc.html. Se reemplazan por la API cuando exista el endpoint.

export type EstadoCondominio = 'Activo' | 'Prueba' | 'Suspendido';

export interface CondominioPlataforma {
  id: number;
  /** No está en el mockup; se usa para la búsqueda "por nombre o RUC". */
  ruc: string;
  iniciales: string;
  nombre: string;
  ciudad: string;
  unidades: number;
  residentes: number;
  admins: number;
  plan: string;
  estado: EstadoCondominio;
  /** Colores del avatar, tal como en el mockup. */
  fondo: string;
  texto: string;
}

export const CONDOMINIOS_PLATAFORMA: CondominioPlataforma[] = [
  {
    id: 1,
    ruc: '1792345678001',
    iniciales: 'JV',
    nombre: 'Jardines del Valle',
    ciudad: 'Cumbayá, Pichincha',
    unidades: 148,
    residentes: 412,
    admins: 2,
    plan: 'Profesional',
    estado: 'Activo',
    fondo: '#E3EFEC',
    texto: '#0B4A47',
  },
  {
    id: 2,
    ruc: '1791234567001',
    iniciales: 'TM',
    nombre: 'Torres del Mirador',
    ciudad: 'Quito',
    unidades: 96,
    residentes: 251,
    admins: 1,
    plan: 'Profesional',
    estado: 'Activo',
    fondo: '#FFF1DC',
    texto: '#8A3F0A',
  },
  {
    id: 3,
    ruc: '1790987654001',
    iniciales: 'LA',
    nombre: 'Los Arrayanes',
    ciudad: 'Tumbaco, Pichincha',
    unidades: 54,
    residentes: 160,
    admins: 1,
    plan: 'Básico',
    estado: 'Activo',
    fondo: '#E6ECF7',
    texto: '#23407A',
  },
  {
    id: 4,
    ruc: '0991234567001',
    iniciales: 'BM',
    nombre: 'Brisas del Mar',
    ciudad: 'Salinas, Santa Elena',
    unidades: 72,
    residentes: 98,
    admins: 1,
    plan: 'Básico',
    estado: 'Prueba',
    fondo: '#E3EFEC',
    texto: '#0B4A47',
  },
  {
    id: 5,
    ruc: '0992345678001',
    iniciales: 'PS',
    nombre: 'Parque Samborondón',
    ciudad: 'Samborondón, Guayas',
    unidades: 210,
    residentes: 588,
    admins: 3,
    plan: 'Empresarial',
    estado: 'Activo',
    fondo: '#FFF1DC',
    texto: '#8A3F0A',
  },
  {
    id: 6,
    ruc: '0190123456001',
    iniciales: 'RC',
    nombre: 'Residencial El Cedro',
    ciudad: 'Cuenca, Azuay',
    unidades: 38,
    residentes: 0,
    admins: 1,
    plan: 'Básico',
    estado: 'Suspendido',
    fondo: '#F1EFE8',
    texto: '#4E4A42',
  },
];
