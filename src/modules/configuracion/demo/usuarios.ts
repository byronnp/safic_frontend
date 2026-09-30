// Datos de ejemplo del mockup F1Usuarios.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface UsuarioDemo {
  nombre: string;
  correo: string;
  roles: string;
  /** Cuenta para el cupo de usuarios administrativos del plan. */
  cuentaCupo: boolean;
  accesoHasta: string;
}

export const USUARIOS: UsuarioDemo[] = [
  {
    nombre: 'María Rodríguez',
    correo: 'm.rodriguez@jardinesdelvalle.ec',
    roles: 'Administradora',
    cuentaCupo: true,
    accesoHasta: '—',
  },
  {
    nombre: 'Jorge Benítez',
    correo: 'jbenitez@gmail.com',
    roles: 'Tesorero · residente A-305',
    cuentaCupo: true,
    accesoHasta: '—',
  },
  {
    nombre: 'Ana Villacís',
    correo: 'ana.villacis@contaec.com',
    roles: 'Contadora · residente B-104',
    cuentaCupo: true,
    accesoHasta: '31 dic 2026',
  },
  {
    nombre: 'Fernando Salazar',
    correo: 'fsalazar@outlook.com',
    roles: 'Presidente · residente C-12',
    cuentaCupo: false,
    accesoHasta: '—',
  },
  {
    nombre: 'Paola Cedeño',
    correo: 'pcedeno@gmail.com',
    roles: 'Vicepresidenta · residente B-201',
    cuentaCupo: false,
    accesoHasta: '—',
  },
  {
    nombre: 'Lucía Andrade',
    correo: 'lucia.andrade@gmail.com',
    roles: 'Secretaria · residente A-110',
    cuentaCupo: false,
    accesoHasta: '—',
  },
  {
    nombre: 'Carlos Mera',
    correo: 'Garita principal',
    roles: 'Guardia',
    cuentaCupo: false,
    accesoHasta: '—',
  },
  {
    nombre: 'Pedro Chila',
    correo: 'Personal',
    roles: 'Mantenimiento',
    cuentaCupo: false,
    accesoHasta: '—',
  },
];

/** Índice del usuario seleccionado al abrir (Ana Villacís, la contadora). */
export const USUARIO_INICIAL = 2;

export const CUPO_PLAN = {
  plan: 'Profesional',
  usados: 3,
  limite: 3,
} as const;

/** Panel lateral del mockup: acceso de la contadora externa. */
export const CONTADORA = {
  iniciales: 'AV',
  nombre: 'Ana Villacís',
  descripcion: 'Contadora externa · también residente B-104',
  acuerdo: 'Acuerdo de confidencialidad v2 aceptado · 03 feb 2026 09:12 · IP 190.12.x.x',
  datos: [
    { etiqueta: 'Permisos', valor: 'Ver y exportar finanzas' },
    { etiqueta: 'Datos de residentes', valor: 'Enmascarados' },
    { etiqueta: 'Segundo factor', valor: 'Activo · app autenticadora' },
    { etiqueta: 'Exportaciones hoy', valor: '4 de 30' },
  ],
  accesoHasta: '31 dic 2026',
  avisarExportaciones: true,
  unidad: 'B-104',
} as const;

export type TipoBitacora = 'Exportó' | 'Vio' | 'Sesión';

export interface EntradaBitacora {
  hora: string;
  recurso: string;
  detalle: string;
  tipo: TipoBitacora;
}

export const BITACORA_CONTADORA: EntradaBitacora[] = [
  {
    hora: 'Hoy 10:42',
    recurso: 'Exportó cartera por antigüedad',
    detalle: 'Excel · 148 filas · código EXP-7Q2K',
    tipo: 'Exportó',
  },
  {
    hora: 'Hoy 10:38',
    recurso: 'Vio reporte de cartera',
    detalle: 'Filtro: vencidas > 30 días',
    tipo: 'Vio',
  },
  {
    hora: 'Hoy 10:31',
    recurso: 'Vio conciliación de septiembre',
    detalle: 'Banco Pichincha · 212 movimientos',
    tipo: 'Vio',
  },
  {
    hora: 'Ayer 16:05',
    recurso: 'Exportó ingresos y gastos',
    detalle: 'Excel · sep 2026 · código EXP-6M9A',
    tipo: 'Exportó',
  },
  {
    hora: 'Ayer 15:58',
    recurso: 'Vio pagos aprobados',
    detalle: 'Filtro: septiembre 2026',
    tipo: 'Vio',
  },
  {
    hora: 'Ayer 15:50',
    recurso: 'Inicio de sesión',
    detalle: '2FA correcto · IP 190.12.x.x',
    tipo: 'Sesión',
  },
  {
    hora: '24 sep 11:20',
    recurso: 'Exportó saldos por unidad',
    detalle: 'PDF · código EXP-5T1C',
    tipo: 'Exportó',
  },
];

// ---------- Directiva ----------

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
