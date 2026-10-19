import { aCentavos } from '@/utils/dinero';
import { formatoMoneda } from '@/utils/formato';

import type { ReservaHoy } from './services/reservas-hoy.service';

/** «Gratis» / «Uso $ 15,00 pagado» / «Uso $ 50,00 y garantía $ 100,00 pagados». */
export function textoPago(r: Pick<ReservaHoy, 'costo' | 'garantia'>): string {
  const uso = aCentavos(r.costo) > 0;
  const gar = aCentavos(r.garantia) > 0;
  if (uso && gar) {
    return `Uso ${formatoMoneda(r.costo)} y garantía ${formatoMoneda(r.garantia)} pagados`;
  }
  if (uso) return `Uso ${formatoMoneda(r.costo)} pagado`;
  return 'Gratis';
}

export const textoHora = (r: Pick<ReservaHoy, 'inicio' | 'fin'>): string => `${r.inicio}–${r.fin}`;

/** Lo que el guardia puede hacer con la reserva ahora. */
export function accionDeReserva(
  r: Pick<ReservaHoy, 'estado' | 'restringida'>,
): 'ingreso' | 'recibir' | 'bloqueada' | null {
  if (r.estado === 'confirmada') return r.restringida ? 'bloqueada' : 'ingreso';
  if (r.estado === 'en_uso') return 'recibir';
  return null;
}

/** Fotos de los daños que el guardia puede adjuntar (el backend acepta lo mismo). */
export const MAX_FOTOS_DANOS = 5;
export const MAX_FOTO_DANOS = 5 * 1024 * 1024;
const TIPOS_FOTO_DANOS = ['image/jpeg', 'image/png'];

/** `null` si las fotos sirven; si no, el motivo en español. */
export function errorFotosDanos(fotos: readonly Pick<File, 'type' | 'size'>[]): string | null {
  if (fotos.length > MAX_FOTOS_DANOS) return `Máximo ${MAX_FOTOS_DANOS} fotos.`;
  if (fotos.some((f) => !TIPOS_FOTO_DANOS.includes(f.type)))
    return 'Las fotos deben ser JPG o PNG.';
  if (fotos.some((f) => f.size > MAX_FOTO_DANOS)) return 'Una foto pesa más de 5 MB.';
  return null;
}
