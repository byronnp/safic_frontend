import { aCentavos, deCentavos } from '@/utils/dinero';
import { formatoFechaCorta, formatoMoneda } from '@/utils/formato';
import { nombreMes } from '@/utils/periodo';

import type { EstadoRevision, PagoDetalle, PagoResumen } from './services/pagos.service';

export const PESTANAS_PAGOS: { valor: EstadoRevision; etiqueta: string }[] = [
  { valor: 'pendiente', etiqueta: 'Por aprobar' },
  { valor: 'aprobado', etiqueta: 'Aprobados' },
  { valor: 'rechazado', etiqueta: 'Rechazados' },
];

export function textoCuotas(pago: Pick<PagoResumen, 'cuotas'>): string {
  const n = pago.cuotas.length;
  if (n === 0) return '—';
  return n === 1 ? nombreMes(pago.cuotas[0]!).split(' ')[0]! : `${n} cuotas`;
}

export function detalleBanco(pago: Pick<PagoResumen, 'banco' | 'fecha'>): string {
  return `${pago.banco ?? 'Banco'} · ${formatoFechaCorta(pago.fecha)}`;
}

/** "Aplicar a 1 cuota completa y $ 20,00 a saldo a favor" (lo que pasaría al aprobar con lo declarado). */
export function textoAplicacion(aplicacion: NonNullable<PagoDetalle['aplicacion']>): string {
  const n = aplicacion.cuotas_completas;
  const cuotas = n === 1 ? '1 cuota completa' : `${n} cuotas completas`;
  const favor = aCentavos(aplicacion.a_saldo_favor);
  if (n === 0) {
    return favor > 0
      ? `El monto no completa ninguna cuota: ${formatoMoneda(aplicacion.a_saldo_favor)} quedan a saldo a favor`
      : 'No se aplica a ninguna cuota';
  }
  return favor > 0
    ? `Aplicar a ${cuotas} y ${formatoMoneda(aplicacion.a_saldo_favor)} a saldo a favor`
    : `Aplicar a ${cuotas}`;
}

/** Monto escrito → texto decimal con dos decimales, o null si no es un monto válido. */
export function montoEscrito(texto: string): string | null {
  const limpio = texto.trim().replace(',', '.');
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(limpio)) return null;
  const centavos = aCentavos(limpio);
  return centavos > 0 ? deCentavos(centavos) : null;
}

/** Hay que mandar `monto_recibido` solo si la persona cambió el monto declarado. */
export function montoParaAprobar(declarado: string, escrito: string): string | undefined | null {
  const monto = montoEscrito(escrito);
  if (monto === null) return null;
  return aCentavos(monto) === aCentavos(declarado) ? undefined : monto;
}

export function errorMotivo(texto: string): string | null {
  const limpio = texto.trim();
  if (limpio === '') return 'Escribe el motivo del rechazo.';
  if (limpio.length < 3) return 'El motivo es muy corto.';
  if (limpio.length > 300) return 'El motivo tiene máximo 300 caracteres.';
  return null;
}

export const COLOR_VALIDACION = { ok: '#0E5E5B', error: '#9B1C12' } as const;
