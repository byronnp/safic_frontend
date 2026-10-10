import { aCentavos, deCentavos, sumaCentavos } from '@/utils/dinero';
import { formatoFechaCorta } from '@/utils/formato';
import { nombreMes } from '@/utils/periodo';

import type {
  CuotaCuenta,
  EstadoPagoCuenta,
  PagoCuenta,
  UnidadCuenta,
} from './services/mi-cuenta.service';

export const COMPROBANTE_MAXIMO_MB = 5;
const TIPOS_COMPROBANTE = ['image/jpeg', 'image/png', 'application/pdf'];

/** "Vencida el 10 jul" · "Vence el 10 oct" · "En revisión" */
export function notaCuota(cuota: Pick<CuotaCuenta, 'estado' | 'vence_el'>): string {
  if (cuota.estado === 'en_revision') return 'En revisión';
  const fecha = formatoFechaCorta(cuota.vence_el);
  return cuota.estado === 'vencida' ? `Vencida el ${fecha}` : `Vence el ${fecha}`;
}

export function mesCuota(cuota: Pick<CuotaCuenta, 'periodo' | 'concepto'>): string {
  const mes = nombreMes(cuota.periodo);
  return cuota.concepto === 'extraordinaria' ? `${mes} · extraordinaria` : mes;
}

/** Las que se pueden elegir para pagar: las que no van ya en un pago en revisión. */
export function cuotasLibres(unidad: Pick<UnidadCuenta, 'cuotas'>): CuotaCuenta[] {
  return unidad.cuotas.filter((c) => c.estado !== 'en_revision');
}

/** Lo que suman las primeras `cantidad` cuotas libres (se paga desde la más antigua), en centavos. */
export function totalSeleccion(libres: readonly CuotaCuenta[], cantidad: number): number {
  return sumaCentavos(libres.slice(0, cantidad).map((c) => c.saldo));
}

/** Lo que hay que transferir: lo que suman las cuotas menos el saldo a favor (nunca negativo). */
export function montoATransferir(
  libres: readonly CuotaCuenta[],
  cantidad: number,
  saldoFavor: string,
): number {
  const total = totalSeleccion(libres, cantidad);
  return total - Math.min(aCentavos(saldoFavor), total);
}

/** La unidad que se muestra al abrir: la pedida, si no la primera que puede pagar, si no la primera. */
export function unidadInicial(
  unidades: readonly UnidadCuenta[],
  preferida?: number | null,
): UnidadCuenta | undefined {
  return (
    unidades.find((u) => u.unidad_id === preferida) ??
    unidades.find((u) => u.puede_pagar) ??
    unidades[0]
  );
}

export function errorNumeroComprobante(texto: string): string | null {
  const limpio = texto.trim();
  if (limpio === '') return 'Escribe el número del comprobante.';
  if (limpio.length < 3) return 'El número del comprobante es muy corto.';
  if (limpio.length > 40 || !/^[0-9A-Za-z\-/. ]+$/.test(limpio)) {
    return 'El número del comprobante solo lleva letras, números y guiones.';
  }
  return null;
}

export function errorArchivoComprobante(
  archivo: { type: string; size: number } | null,
): string | null {
  if (archivo === null) return 'Sube la foto o el PDF del comprobante.';
  if (!TIPOS_COMPROBANTE.includes(archivo.type))
    return 'El comprobante debe ser una foto (JPG o PNG) o un PDF.';
  if (archivo.size > COMPROBANTE_MAXIMO_MB * 1024 * 1024) {
    return `El comprobante pesa más de ${COMPROBANTE_MAXIMO_MB} MB.`;
  }
  return null;
}

export const TEXTO_ESTADO_PAGO: Record<EstadoPagoCuenta, string> = {
  pendiente: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  anulado: 'Anulado',
};

export const TONO_ESTADO_PAGO: Record<EstadoPagoCuenta, 'alerta' | 'exito' | 'error' | 'neutro'> = {
  pendiente: 'alerta',
  aprobado: 'exito',
  rechazado: 'error',
  anulado: 'neutro',
};

/** "Julio, Agosto" de los periodos que dijo pagar. */
export function mesesDelPago(pago: Pick<PagoCuenta, 'cuotas'>): string {
  return pago.cuotas.map((p) => nombreMes(p).split(' ')[0]).join(', ') || '—';
}

export { deCentavos };
