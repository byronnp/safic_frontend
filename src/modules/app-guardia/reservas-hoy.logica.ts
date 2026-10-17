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
