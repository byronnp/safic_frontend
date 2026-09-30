// Datos de ejemplo del mockup F1Apariencia.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface DatosGeneralesCondominio {
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  correo: string;
}

export interface UbicacionCondominio {
  provincia: string;
  canton: string;
  parroquia: string;
  direccion: string;
}

export interface AparienciaCondominio {
  /** Color principal elegido (hex). */
  primario: string;
  /** Color de acento (hex). */
  acento: string;
}

export type EstadoVistaPrevia = 'pagado' | 'pendiente' | 'vencido';

export interface FilaVistaPrevia {
  texto: string;
  estado: EstadoVistaPrevia;
  etiqueta: string;
}

export const DATOS_GENERALES: DatosGeneralesCondominio = {
  nombre: 'Conjunto Jardines del Valle',
  ruc: '1792345678001',
  direccion: 'Av. Ilaló y calle Los Guabos, Sangolquí',
  telefono: '02 233 4455',
  correo: 'administracion@jardinesdelvalle.ec',
};

export const UBICACION: UbicacionCondominio = {
  provincia: 'Pichincha',
  canton: 'Rumiñahui',
  parroquia: 'San Rafael',
  direccion: 'Av. Ilaló y calle Los Guabos, junto al Parque Central',
};

export const PROVINCIAS = ['Pichincha', 'Guayas', 'Azuay', 'Manabí', 'Imbabura', 'Tungurahua'];

/** Iniciales del logo de ejemplo. */
export const LOGO_INICIALES = 'JV';

export const NOMBRE_CORTO = 'Jardines del Valle';

/** Apariencia guardada del condominio (estado inicial del mockup). */
export const APARIENCIA_GUARDADA: AparienciaCondominio = {
  primario: '#1F4C9A',
  acento: '#F0B35A',
};

/** Apariencia por defecto de SAFIC (botón Restablecer). */
export const APARIENCIA_PREDETERMINADA: AparienciaCondominio = {
  primario: '#0E5E5B',
  acento: '#F0B35A',
};

export const PALETA_PRIMARIO = [
  '#0E5E5B',
  '#1F4C9A',
  '#7A2E5A',
  '#2E7D32',
  '#B8641C',
  '#C62828',
  '#F2C94C',
];

export const PALETA_ACENTO = ['#F0B35A', '#4FC3F7', '#FF8A65', '#9CCC65', '#BA68C8', '#FFFFFF'];

export const FILAS_VISTA_PREVIA: FilaVistaPrevia[] = [
  { texto: 'A-102 · Diego Mora', estado: 'pagado', etiqueta: 'Pagado' },
  { texto: 'B-305 · Andrea Villacís', estado: 'pendiente', etiqueta: 'Pendiente' },
  { texto: 'C-204 · Verónica Loor', estado: 'vencido', etiqueta: 'Vencido' },
];
