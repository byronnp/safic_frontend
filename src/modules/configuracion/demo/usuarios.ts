// Datos de ejemplo de la pestaña Directiva del mockup F1Usuarios.dc.html.
// Se reemplazan por la API cuando exista el endpoint de cargos.

export interface CargoDirectiva {
  cargo: 'Presidente' | 'Vicepresidente' | 'Secretario' | 'Tesorero';
  nombre: string;
  unidad: string;
  periodo: string;
  acta: string;
  prorrogado: boolean;
}

export const DIRECTIVA: CargoDirectiva[] = [
  {
    cargo: 'Presidente',
    nombre: 'Fernando Salazar',
    unidad: 'C-12',
    periodo: '15 mar 2026 – 15 mar 2027',
    acta: 'Acta 2026-01',
    prorrogado: false,
  },
  {
    cargo: 'Vicepresidente',
    nombre: 'Paola Cedeño',
    unidad: 'B-201',
    periodo: '15 mar 2026 – 15 mar 2027',
    acta: 'Acta 2026-01',
    prorrogado: false,
  },
  {
    cargo: 'Secretario',
    nombre: 'Lucía Andrade',
    unidad: 'A-110',
    periodo: '20 mar 2025 – 20 mar 2026',
    acta: 'Acta 2025-02',
    prorrogado: true,
  },
  {
    cargo: 'Tesorero',
    nombre: 'Jorge Benítez',
    unidad: 'A-305',
    periodo: '15 mar 2026 – 15 mar 2027',
    acta: 'Acta 2026-01',
    prorrogado: false,
  },
];

export interface CandidatoDirectiva {
  nombre: string;
  unidad: string;
  enMora: boolean;
}

/** Residentes propietarios que podrían ocupar un cargo. */
export const CANDIDATOS_DIRECTIVA: CandidatoDirectiva[] = [
  { nombre: 'Carmen Loor', unidad: 'A-102', enMora: false },
  { nombre: 'Diego Salas', unidad: 'B-310', enMora: false },
  { nombre: 'Ricardo Vera', unidad: 'C-08', enMora: true },
  { nombre: 'Paola Cedeño', unidad: 'B-201', enMora: false },
  { nombre: 'Lucía Andrade', unidad: 'A-110', enMora: false },
  { nombre: 'Jorge Benítez', unidad: 'A-305', enMora: false },
  { nombre: 'Fernando Salazar', unidad: 'C-12', enMora: false },
];

/** Valores sugeridos al cambiar un cargo (mockup). */
export const NUEVO_PERIODO = {
  acta: 'Acta 2026-03 · 26 sep',
  actaCorta: 'Acta 2026-03',
  hasta: '26 sep 2027',
  periodo: '26 sep 2026 – 26 sep 2027',
} as const;
