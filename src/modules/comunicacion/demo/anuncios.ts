// Datos de ejemplo del mockup F4Anuncios.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface Anuncio {
  id: string;
  titulo: string;
  publicado: string;
  destino: string;
  expira?: string;
  /** Porcentaje de lectura (0–100) */
  leido: number;
  fijado: boolean;
  confirmacion: boolean;
  /** Solo con confirmación de lectura */
  confirmadas?: number;
  totalUnidades?: number;
}

export interface DestinoAnuncio {
  id: string;
  nombre: string;
  /** Texto de alcance bajo las opciones; vacío si falta elegir unidades */
  alcance: string;
}

export const ANUNCIOS: Anuncio[] = [
  {
    id: 'a1',
    titulo: 'Convocatoria a asamblea ordinaria de copropietarios · 17 de octubre, 19:00',
    publicado: '22 sep',
    destino: 'Todo el condominio',
    leido: 72,
    fijado: true,
    confirmacion: true,
    confirmadas: 107,
    totalUnidades: 148,
  },
  {
    id: 'a2',
    titulo: 'Corte de agua programado · martes 29 sep, 09:00–13:00',
    publicado: '25 sep',
    destino: 'Torre A y Torre B',
    expira: '29 sep',
    leido: 64,
    fijado: false,
    confirmacion: false,
  },
  {
    id: 'a3',
    titulo: 'Fumigación de áreas comunes',
    publicado: '18 sep',
    destino: 'Todo el condominio',
    leido: 81,
    fijado: false,
    confirmacion: false,
  },
  {
    id: 'a4',
    titulo: 'Nuevo horario del gimnasio',
    publicado: '10 sep',
    destino: 'Todo el condominio',
    leido: 58,
    fijado: false,
    confirmacion: false,
  },
];

export const DESTINOS_ANUNCIO: DestinoAnuncio[] = [
  {
    id: 'todos',
    nombre: 'Todo el condominio',
    alcance: 'Llegará a 148 unidades · 402 personas con cuenta',
  },
  { id: 'torre-c', nombre: 'Torre C', alcance: 'Llegará a 48 unidades · 131 personas con cuenta' },
  { id: 'unidades', nombre: 'Unidades…', alcance: '' },
];

export const BORRADOR_ANUNCIO = {
  titulo: 'Mantenimiento de ascensores',
  destino: 'torre-c',
  mensaje:
    'El jueves 1 de octubre, de 08:00 a 12:00, los ascensores de la Torre C estarán fuera de servicio por mantenimiento preventivo. Gracias por su comprensión.',
  fijar: false,
  confirmacion: false,
  expira: '1 oct 2026',
};

export const FECHA_PUBLICACION_HOY = '27 sep';
