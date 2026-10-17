import { formatoMoneda } from '@/utils/formato';

import type { ClaveReporte, TipoColumna } from './services/reportes.service';

export interface InfoReporte {
  clave: ClaveReporte;
  titulo: string;
  descripcion: string;
  icono: string;
  /** Los reportes «a la fecha» (cartera, estados de cuenta) no dependen del mes elegido. */
  usaPeriodo: boolean;
}

export const REPORTES: InfoReporte[] = [
  {
    clave: 'ingresos_gastos',
    titulo: 'Ingresos vs. gastos',
    descripcion: 'Por mes y por categoría, con el saldo de cada banco.',
    icono: 'sym_r_bar_chart',
    usaPeriodo: true,
  },
  {
    clave: 'cartera_antiguedad',
    titulo: 'Cartera por antigüedad',
    descripcion: 'Al día, 1–30, 31–60, 61–90 y más de 90 días por unidad.',
    icono: 'sym_r_warning',
    usaPeriodo: false,
  },
  {
    clave: 'recaudacion_mensual',
    titulo: 'Recaudación mensual',
    descripcion: 'Emitido, cobrado y porcentaje de cobro por mes.',
    icono: 'sym_r_receipt_long',
    usaPeriodo: true,
  },
  {
    clave: 'conciliaciones',
    titulo: 'Conciliaciones',
    descripcion: 'Movimientos conciliados y pendientes por cuenta.',
    icono: 'sym_r_account_balance',
    usaPeriodo: true,
  },
  {
    clave: 'gastos_proveedor',
    titulo: 'Gastos por proveedor',
    descripcion: 'Facturas, pagos y saldo por pagar de cada proveedor.',
    icono: 'sym_r_storefront',
    usaPeriodo: true,
  },
  {
    clave: 'estados_cuenta',
    titulo: 'Estados de cuenta',
    descripcion:
      'Saldo, vencido y atraso de todas las unidades. El PDF de una unidad se baja desde su ficha.',
    icono: 'sym_r_description',
    usaPeriodo: false,
  },
];

/** Cómo se muestra una celda según el tipo de su columna. */
export function formatoCelda(valor: string | number | null | undefined, tipo: TipoColumna): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  switch (tipo) {
    case 'dinero':
      return formatoMoneda(String(valor));
    case 'porcentaje':
      return `${valor} %`;
    case 'entero':
      return Number(valor).toLocaleString('es-EC');
    default:
      return String(valor);
  }
}

/** Alinea a la derecha lo numérico. */
export function esNumerica(tipo: TipoColumna): boolean {
  return tipo !== 'texto';
}

/** «hoy 10:42», «ayer 16:05» o «2 oct 09:30», en la hora de Ecuador. */
export function fechaExportacion(iso: string, ahora: Date = new Date()): string {
  const f = new Date(iso);
  const dia = (d: Date): string =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Guayaquil',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  const hora = new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(f);
  const hoy = dia(ahora);
  const ayer = dia(new Date(ahora.getTime() - 24 * 3600 * 1000));

  if (dia(f) === hoy) return `Hoy ${hora}`;
  if (dia(f) === ayer) return `Ayer ${hora}`;
  const corta = new Intl.DateTimeFormat('es-EC', {
    timeZone: 'America/Guayaquil',
    day: 'numeric',
    month: 'short',
  })
    .format(f)
    .replace('.', '');
  return `${corta} ${hora}`;
}

export function nombreArchivo(reporte: ClaveReporte, periodo: string): string {
  return `${reporte.replaceAll('_', '-')}-${periodo}.xlsx`;
}

export const POLITICA_EXPORTACION =
  'Cada archivo lleva un código único. Las exportaciones quedan en la bitácora, con quién las hizo. Se pueden exportar hasta 30 archivos por día.';

/** El mes que se pide: los reportes «a la fecha» no dependen de él, así que van con uno fijo (misma clave de caché). */
export function periodoDe(
  info: Pick<InfoReporte, 'usaPeriodo'>,
  elegido: string,
  hoy: string,
): string {
  return info.usaPeriodo ? elegido : hoy.slice(0, 7);
}
