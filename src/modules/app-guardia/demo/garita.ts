// Datos de ejemplo del mockup F4Garita.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface GaritaTurno {
  garita: string;
  turno: string;
  guardia: string;
}

export interface GaritaVisitaDentro {
  id: string;
  nombre: string;
  detalle: string;
}

export interface GaritaVisitaEsperada {
  id: string;
  nombre: string;
  detalle: string;
}

/** Resultado de leer el QR de una visita autorizada por un residente. */
export interface GaritaQrLeido {
  id: string;
  nombre: string;
  unidad: string;
  autorizo: string;
  vigencia: string;
  placa: string;
}

export interface GaritaPaquete {
  id: string;
  unidad: string;
  empresa: string;
  recibido: string;
  /** Lleva muchos días en garita: se resalta en rojo. */
  atrasado: boolean;
}

export const GARITA_TURNO: GaritaTurno = {
  garita: 'Garita principal',
  turno: 'Turno día',
  guardia: 'J. Pazmiño',
};

export const GARITA_DENTRO: GaritaVisitaDentro[] = [
  { id: 'd1', nombre: 'Carlos Vega', detalle: 'A-201 · visita · desde 13:40' },
  { id: 'd2', nombre: 'Rappi · Luis M.', detalle: 'CS-07 · delivery · desde 14:55' },
  { id: 'd3', nombre: 'Plomero Andrade', detalle: 'B-306 · proveedor · desde 11:20' },
];

export const GARITA_ESPERADAS: GaritaVisitaEsperada[] = [
  { id: 'e1', nombre: 'Invitados de CS-04 (12)', detalle: 'Reserva Salón comunal · 17:30–23:30' },
  { id: 'e2', nombre: 'María Chiluisa', detalle: 'C-110 · recurrente lun–vie 08:00–17:00' },
  { id: 'e3', nombre: 'Técnico de internet', detalle: 'B-112 · proveedor · 10:00–13:00' },
];

export const GARITA_QR_LEIDO: GaritaQrLeido = {
  id: 'd0',
  nombre: 'Juan Pérez',
  unidad: 'A-102',
  autorizo: 'Diego Mora',
  vigencia: 'Válido hoy 15:00–20:00',
  placa: 'PDQ-3321',
};

export const GARITA_PAQUETES: GaritaPaquete[] = [
  {
    id: 'p1',
    unidad: 'A-102',
    empresa: 'Servientrega',
    recibido: 'Recibido hoy 10:12 · aviso enviado',
    atrasado: false,
  },
  {
    id: 'p2',
    unidad: 'C-110',
    empresa: 'Amazon · Laarcourier',
    recibido: 'Hace 3 días',
    atrasado: false,
  },
  {
    id: 'p3',
    unidad: 'B-305',
    empresa: 'Tramaco',
    recibido: 'Hace 8 días · recordatorio enviado',
    atrasado: true,
  },
];
