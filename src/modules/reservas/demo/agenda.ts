// Datos de ejemplo del mockup F3Agenda.dc.html. Se reemplazan por la API cuando exista el endpoint.

export type TipoReservaAgenda = 'ok' | 'pend' | 'blk';

export interface DiaAgenda {
  dow: string;
  num: number;
}

export interface AreaAgenda {
  area: string;
  meta: string;
}

export interface ReservaAgenda {
  /** Índice del área (fila) */
  row: number;
  /** Índice del día (columna) */
  day: number;
  hora: string;
  txt: string;
  k: TipoReservaAgenda;
}

export interface SolicitudAgenda {
  id: string;
  area: string;
  row: number;
  day: number;
  fecha: string;
  hora: string;
  unidad: string;
  persona: string;
  invitados: string;
  vence: string;
}

export const SEMANA_AGENDA = 'Semana del 28 sep al 4 oct';

export const DIAS_AGENDA: DiaAgenda[] = [
  { dow: 'LUN', num: 28 },
  { dow: 'MAR', num: 29 },
  { dow: 'MIÉ', num: 30 },
  { dow: 'JUE', num: 1 },
  { dow: 'VIE', num: 2 },
  { dow: 'SÁB', num: 3 },
  { dow: 'DOM', num: 4 },
];

export const AREAS_AGENDA: AreaAgenda[] = [
  { area: 'Salón comunal', meta: '60 pers. · $ 50 + $ 100 garantía' },
  { area: 'Área BBQ 1', meta: '15 pers. · $ 15 · sin garantía' },
  { area: 'Área BBQ 2', meta: '15 pers. · $ 15 · sin garantía' },
  { area: 'Cancha múltiple', meta: 'Gratis · máx. 2 h' },
];

export const RESERVAS_AGENDA: ReservaAgenda[] = [
  { row: 0, day: 5, hora: '18:00–23:00', txt: 'CS-04', k: 'ok' },
  { row: 1, day: 5, hora: '12:00–16:00', txt: 'A-201', k: 'ok' },
  { row: 1, day: 6, hora: '11:00–15:00', txt: 'B-112', k: 'ok' },
  { row: 2, day: 2, hora: 'Todo el día', txt: 'Mantenimiento parrilla', k: 'blk' },
  { row: 2, day: 5, hora: '13:00–17:00', txt: 'B-305', k: 'ok' },
  { row: 3, day: 1, hora: '18:00–20:00', txt: 'A-102', k: 'ok' },
  { row: 3, day: 3, hora: '19:00–21:00', txt: 'CS-07', k: 'ok' },
  { row: 3, day: 5, hora: '09:00–11:00', txt: 'B-306', k: 'ok' },
];

export const SOLICITUDES_AGENDA: SolicitudAgenda[] = [
  {
    id: 'p1',
    area: 'Salón comunal',
    row: 0,
    day: 4,
    fecha: 'Vie 2 oct',
    hora: '19:00–23:00',
    unidad: 'A-305',
    persona: 'Luis Benítez',
    invitados: '40 invitados',
    vence: 'Vence en 20 h',
  },
  {
    id: 'p2',
    area: 'Salón comunal',
    row: 0,
    day: 6,
    fecha: 'Dom 4 oct',
    hora: '12:00–17:00',
    unidad: 'C-110',
    persona: 'Paola Ruiz',
    invitados: '25 invitados',
    vence: 'Vence en 41 h',
  },
];
