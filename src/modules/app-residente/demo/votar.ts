// Datos de ejemplo del mockup F5Votar.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface VotarAsamblea {
  titulo: string;
  condominio: string;
  unidad: string;
  /** Alícuota de la unidad, en porcentaje. */
  alicuota: number;
  asistencia: string;
}

export interface VotarPunto {
  etiqueta: string;
  titulo: string;
  documento: string;
  horaVoto: string;
}

export interface VotarLineaOrden {
  texto: string;
  destacada: boolean;
}

/** Simula el estado "en mora" del mockup (propiedad enMora). */
export const VOTAR_EN_MORA = false;

export const VOTAR_ASAMBLEA: VotarAsamblea = {
  titulo: 'Asamblea ordinaria 2026',
  condominio: 'Jardines del Valle',
  unidad: 'A-201',
  alicuota: 0.71,
  asistencia: 'Asistencia registrada · 19:05 · cuentas para el quórum (58,4 %)',
};

export const VOTAR_PUNTO: VotarPunto = {
  etiqueta: 'PUNTO 4 · VOTACIÓN ABIERTA',
  titulo: 'Presupuesto 2027 y valor de alícuotas',
  documento: 'Ver documento del presupuesto',
  horaVoto: '19:42',
};

export const VOTAR_OPCIONES = ['Sí', 'No', 'Abstención'] as const;

export const VOTAR_ORDEN_DEL_DIA: VotarLineaOrden[] = [
  {
    texto: '1. Quórum ✓ · 2. Informe ✓ · 3. Estados financieros ✓ Aprobado',
    destacada: false,
  },
  { texto: '4. Presupuesto 2027 · votando', destacada: true },
  { texto: '5. Elección de directiva · 6. Reforma del reglamento', destacada: false },
];
