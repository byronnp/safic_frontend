// Datos de ejemplo del mockup F5Mesa.dc.html. Se reemplazan por la API cuando exista el endpoint.

export type EstadoPuntoMesa = 'Hecho' | 'Aprobado' | 'En votación' | 'Pendiente';

export interface PuntoMesa {
  titulo: string;
  estado: EstadoPuntoMesa;
}

export interface ResultadoVotacion {
  emitidos: number;
  /** Porcentajes Sí, No y Abstención sobre alícuotas presentes con derecho a voto */
  si: number;
  no: number;
  abstencion: number;
}

export const ASAMBLEA_MESA = {
  condominio: 'Conjunto Jardines del Valle',
  fecha: 'Sáb 17 oct 2026',
  titulo: 'Asamblea ordinaria 2026',
  instalacion: 'Instalada en 1.ª convocatoria · 19:12',
  presidente: 'Fernando Salazar',
};

export const QUORUM_MESA = {
  porcentaje: 58.4,
  minimo: 50,
  minimoTexto: 'Mínimo 1.ª convocatoria: más de 50 %',
  presencial: 62,
  enApp: 14,
  conPoder: 5,
};

export const PUNTOS_MESA: PuntoMesa[] = [
  { titulo: 'Constatación del quórum', estado: 'Hecho' },
  { titulo: 'Informe de la administración', estado: 'Hecho' },
  { titulo: 'Estados financieros', estado: 'Aprobado' },
  { titulo: 'Presupuesto 2027', estado: 'En votación' },
  { titulo: 'Elección de directiva', estado: 'Pendiente' },
  { titulo: 'Reforma del reglamento', estado: 'Pendiente' },
];

/** Índice del punto que se está votando */
export const PUNTO_ACTUAL_MESA = 3;

export const VOTACION_MESA = {
  antetitulo: 'PUNTO 4 · VOTACIÓN · MAYORÍA SIMPLE DE PRESENTES',
  titulo: 'Presupuesto 2027 y valor de alícuotas',
  presentesConVoto: 77,
  presentesEnMora: 4,
  resultadoFinal: 'APROBADO · 71,3 % de las alícuotas presentes votó Sí',
  siguientePunto: 'Elección de directiva',
};

export const RESULTADO_ABIERTA: ResultadoVotacion = {
  emitidos: 66,
  si: 61.8,
  no: 19.5,
  abstencion: 4.2,
};

export const RESULTADO_CERRADA: ResultadoVotacion = {
  emitidos: 77,
  si: 71.3,
  no: 22.4,
  abstencion: 6.3,
};
