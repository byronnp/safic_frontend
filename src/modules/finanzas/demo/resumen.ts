// Datos de ejemplo del mockup F2Resumen.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface ResumenIndicadores {
  periodo: string;
  periodoAbierto: boolean;
  recaudado: number;
  esperado: number;
  carteraVencida: number;
  unidadesVencidas: number;
  gastos: number;
  gastosDetalle: string;
  pagosPorAprobar: number;
  montoPorAprobar: number;
}

export interface ResumenTramoCartera {
  etiqueta: string;
  monto: number;
  unidades: number;
  /** Ancho de la barra en porcentaje (0–100). */
  porcentaje: number;
  color: string;
}

export interface ResumenConciliacion {
  cuenta: string;
  saldoBanco: number;
  saldoApp: number;
  mes: string;
}

export interface ResumenPagoAprobado {
  unidad: string;
  detalle: string;
  monto: number;
}

export interface ResumenMetodoCobro {
  metodo: string;
  valores: { tipo: string; monto: number }[];
  diaVencimiento: number;
}

export const RESUMEN_INDICADORES: ResumenIndicadores = {
  periodo: 'Septiembre 2026',
  periodoAbierto: true,
  recaudado: 9856,
  esperado: 12320,
  carteraVencida: 4400,
  unidadesVencidas: 31,
  gastos: 7215.4,
  gastosDetalle: 'Seguridad, limpieza, agua y mantenimiento',
  pagosPorAprobar: 7,
  montoPorAprobar: 699.59,
};

export const RESUMEN_CARTERA: ResumenTramoCartera[] = [
  { etiqueta: 'Al día', monto: 9856, unidades: 117, porcentaje: 100, color: '#0E5E5B' },
  { etiqueta: '1–30 días', monto: 1840, unidades: 19, porcentaje: 19, color: '#C98A2B' },
  { etiqueta: '31–60 días', monto: 960, unidades: 6, porcentaje: 10, color: '#B8641C' },
  { etiqueta: '61–90 días', monto: 480, unidades: 2, porcentaje: 5, color: '#A0451A' },
  { etiqueta: 'Más de 90', monto: 1120, unidades: 4, porcentaje: 11, color: '#9B1C12' },
];

export const RESUMEN_METODO_COBRO: ResumenMetodoCobro = {
  metodo: 'valor por tipo',
  valores: [
    { tipo: 'Departamento', monto: 80 },
    { tipo: 'Casa', monto: 120 },
  ],
  diaVencimiento: 10,
};

export const RESUMEN_CONCILIACION: ResumenConciliacion = {
  cuenta: 'Banco Pichincha · Cte. ****4821',
  saldoBanco: 18419,
  saldoApp: 18420.6,
  mes: 'septiembre',
};

export const RESUMEN_ULTIMOS_PAGOS: ResumenPagoAprobado[] = [
  { unidad: 'A-201', detalle: 'Transferencia · 1 cuota', monto: 80 },
  { unidad: 'CS-04', detalle: 'Transferencia · 2 cuotas', monto: 240 },
  { unidad: 'B-306', detalle: 'Efectivo · 1 cuota', monto: 80 },
  { unidad: 'C-110', detalle: 'Transferencia · 3 cuotas', monto: 240 },
];
