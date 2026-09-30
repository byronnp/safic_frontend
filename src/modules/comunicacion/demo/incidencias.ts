// Datos de ejemplo del mockup F4Tickets.dc.html. Se reemplazan por la API cuando exista el endpoint.

export type PrioridadIncidencia = 'Alta' | 'Media' | 'Baja';

/** 0 Abierto · 1 En proceso · 2 Resuelto · 3 Cerrado */
export type EstadoIncidencia = 0 | 1 | 2 | 3;

export interface Incidencia {
  id: string;
  num: number;
  titulo: string;
  cat: string;
  prio: PrioridadIncidencia;
  unidad: string;
  autor: string;
  hace: string;
  desc: string;
  estado: EstadoIncidencia;
}

export interface ComentarioIncidencia {
  autor: string;
  texto: string;
  interna: boolean;
}

export const COLUMNAS_INCIDENCIAS = ['Abierto', 'En proceso', 'Resuelto', 'Cerrado'] as const;

export const TIEMPO_PROMEDIO_RESPUESTA = '6 h';

export const INCIDENCIAS: Incidencia[] = [
  {
    id: 't1',
    num: 214,
    titulo: 'Luz dañada en el parqueadero subterráneo',
    cat: 'Mantenimiento',
    prio: 'Alta',
    unidad: 'Guardia',
    autor: 'J. Pazmiño (guardia)',
    hace: 'hace 2 h',
    desc: 'Tres lámparas apagadas en la zona de visitas del subsuelo 1. Queda muy oscuro de noche.',
    estado: 0,
  },
  {
    id: 't2',
    num: 213,
    titulo: 'Ruido después de las 23:00',
    cat: 'Convivencia',
    prio: 'Media',
    unidad: 'B-306',
    autor: 'Jorge Cevallos',
    hace: 'hace 5 h',
    desc: 'Música alta en el piso de arriba varias noches seguidas.',
    estado: 0,
  },
  {
    id: 't3',
    num: 209,
    titulo: 'Filtración en el techo del ascensor 2',
    cat: 'Mantenimiento',
    prio: 'Alta',
    unidad: 'C-110',
    autor: 'Paola Ruiz',
    hace: 'hace 1 día',
    desc: 'Cae agua dentro del ascensor cuando llueve.',
    estado: 1,
  },
  {
    id: 't4',
    num: 207,
    titulo: 'Puerta peatonal no cierra sola',
    cat: 'Seguridad',
    prio: 'Media',
    unidad: 'A-201',
    autor: 'Fernando Salazar',
    hace: 'hace 2 días',
    desc: 'La puerta de la entrada peatonal queda abierta.',
    estado: 1,
  },
  {
    id: 't5',
    num: 201,
    titulo: 'Césped del parque infantil sin cortar',
    cat: 'Áreas verdes',
    prio: 'Baja',
    unidad: 'CS-04',
    autor: 'Gabriela Torres',
    hace: 'hace 4 días',
    desc: 'El césped está muy alto.',
    estado: 2,
  },
  {
    id: 't6',
    num: 198,
    titulo: 'Timbre del intercomunicador A-102',
    cat: 'Mantenimiento',
    prio: 'Baja',
    unidad: 'A-102',
    autor: 'Diego Mora',
    hace: 'hace 6 días',
    desc: 'No suena el intercomunicador.',
    estado: 3,
  },
];

export const COMENTARIOS_INCIDENCIA: ComentarioIncidencia[] = [
  {
    autor: 'Administración',
    texto: 'Ya coordinamos con el técnico, viene mañana a las 09:00.',
    interna: false,
  },
  {
    autor: 'Nota interna',
    texto: 'Cotización $ 85,00. No visible para el residente.',
    interna: true,
  },
];

/** Texto del botón que avanza el estado, según el estado actual */
export const ACCION_AVANZAR_INCIDENCIA = [
  'Pasar a En proceso',
  'Marcar resuelto',
  'Esperando al residente',
  'Cerrado',
] as const;
