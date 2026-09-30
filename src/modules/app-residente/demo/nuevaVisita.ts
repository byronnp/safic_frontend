// Datos de ejemplo del mockup F4NuevaVisita.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface NuevaVisitaFormulario {
  nombre: string;
  cedula: string;
  fecha: string;
  desde: string;
  hasta: string;
  placa: string;
}

export interface NuevaVisitaDia {
  id: string;
  letra: string;
  nombre: string;
}

export const NUEVA_VISITA_FORMULARIO: NuevaVisitaFormulario = {
  nombre: 'Juan Pérez',
  cedula: '',
  fecha: 'Hoy, 26 sep',
  desde: '15:00',
  hasta: '20:00',
  placa: 'PDQ-3321',
};

export const NUEVA_VISITA_DIAS: NuevaVisitaDia[] = [
  { id: 'lun', letra: 'L', nombre: 'Lunes' },
  { id: 'mar', letra: 'M', nombre: 'Martes' },
  { id: 'mie', letra: 'M', nombre: 'Miércoles' },
  { id: 'jue', letra: 'J', nombre: 'Jueves' },
  { id: 'vie', letra: 'V', nombre: 'Viernes' },
  { id: 'sab', letra: 'S', nombre: 'Sábado' },
  { id: 'dom', letra: 'D', nombre: 'Domingo' },
];

export const NUEVA_VISITA_DIAS_INICIALES = ['lun', 'mar', 'mie', 'jue', 'vie'];

export const NUEVA_VISITA_RECURRENTE_HORARIO = '08:00–17:00 · hasta el 31 dic 2026';

export const NUEVA_VISITA_VIGENCIA = {
  unica: 'Hoy 26 sep · 15:00–20:00 · un solo ingreso',
  recurrente: 'Lun a vie · 08:00–17:00 · hasta 31 dic 2026',
};

export const NUEVA_VISITA_CONDOMINIO = 'Conjunto Jardines del Valle';

export const NUEVA_VISITA_UNIDAD = 'A-102';
