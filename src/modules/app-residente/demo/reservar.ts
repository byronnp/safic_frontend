// Datos de ejemplo del mockup F3Reservar.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface ReservarArea {
  nombre: string;
  nombreCompleto: string;
  capacidad: string;
  costo: string;
  costoResumen: string;
  aprobacion: string;
  gratis: boolean;
  /** Pide garantía y aprobación de la administración. */
  conGarantia: boolean;
  horarios: string[];
}

export interface ReservarDia {
  diaSemana: string;
  numero: number;
}

/** Simula el estado "en mora" del mockup (propiedad enMora). */
export const RESERVAR_EN_MORA = false;

export const RESERVAR_GARANTIA = '$ 100,00';

export const RESERVAR_MES = 'oct';

export const RESERVAR_AREAS: ReservarArea[] = [
  {
    nombre: 'Salón',
    nombreCompleto: 'Salón comunal',
    capacidad: '60 pers.',
    costo: '$ 50,00',
    costoResumen: '$ 50 + garantía',
    aprobacion: 'Con aprobación',
    gratis: false,
    conGarantia: true,
    horarios: ['10:00–14:00', '14:00–18:00', '18:00–23:00'],
  },
  {
    nombre: 'BBQ 1',
    nombreCompleto: 'Área BBQ 1',
    capacidad: '15 pers.',
    costo: '$ 15,00',
    costoResumen: '$ 15',
    aprobacion: 'Confirmación inmediata',
    gratis: false,
    conGarantia: false,
    horarios: ['10:00–13:00', '13:00–16:00', '16:00–19:00', '19:00–22:00'],
  },
  {
    nombre: 'BBQ 2',
    nombreCompleto: 'Área BBQ 2',
    capacidad: '15 pers.',
    costo: '$ 15,00',
    costoResumen: '$ 15',
    aprobacion: 'Confirmación inmediata',
    gratis: false,
    conGarantia: false,
    horarios: ['10:00–13:00', '13:00–16:00', '16:00–19:00', '19:00–22:00'],
  },
  {
    nombre: 'Cancha',
    nombreCompleto: 'Cancha múltiple',
    capacidad: 'Máx. 2 h',
    costo: 'Gratis',
    costoResumen: 'Gratis',
    aprobacion: 'Confirmación inmediata',
    gratis: true,
    conGarantia: false,
    horarios: ['08:00–10:00', '10:00–12:00', '16:00–18:00', '18:00–20:00'],
  },
];

export const RESERVAR_DIAS: ReservarDia[] = [
  { diaSemana: 'VIE', numero: 2 },
  { diaSemana: 'SÁB', numero: 3 },
  { diaSemana: 'DOM', numero: 4 },
  { diaSemana: 'LUN', numero: 5 },
  { diaSemana: 'MAR', numero: 6 },
  { diaSemana: 'MIÉ', numero: 7 },
  { diaSemana: 'JUE', numero: 8 },
];

/** Horarios ocupados de ejemplo (misma regla que el mockup). */
export function reservarHorarioOcupado(area: number, dia: number, horario: number): boolean {
  return (area * 3 + dia * 2 + horario) % 5 === 0 || (area === 1 && dia === 1 && horario === 1);
}
