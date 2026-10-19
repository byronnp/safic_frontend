import { aCentavos, deCentavos, sumaCentavos } from '@/utils/dinero';
import { formatoFechaCorta, formatoMoneda } from '@/utils/formato';
import { mesEnFrase } from '@/utils/periodo';

import type { UnidadCuenta } from './services/mi-cuenta.service';

/**
 * Notificaciones del residente que no son anuncios de la administración (esos tienen su propia lista). Hoy: paquetes en garita
 * (los arma la página con `paquetes.logica`) y cuotas (este archivo). La convocatoria a asamblea se suma cuando exista la API de
 * Asambleas (F5): no se inventa.
 */
export interface NotificacionCuota {
  /** Estable entre consultas, para el `key` de la lista. */
  id: string;
  titulo: string;
  detalle: string;
  vencida: boolean;
}

/**
 * Por cada unidad: un aviso con las cuotas vencidas (si las hay) y otro con la próxima por vencer. Las que ya van en un pago en
 * revisión no avisan: el residente ya hizo su parte. Con varias unidades se indica cuál es.
 */
export function notificacionesDeCuotas(unidades: readonly UnidadCuenta[]): NotificacionCuota[] {
  const variasUnidades = unidades.length > 1;
  const avisos: NotificacionCuota[] = [];

  for (const unidad of unidades) {
    const deudas = unidad.cuotas.filter(
      (c) => c.estado !== 'en_revision' && aCentavos(c.saldo) > 0,
    );
    const vencidas = deudas.filter((c) => c.estado === 'vencida');
    const proxima = deudas
      .filter((c) => c.estado === 'pendiente')
      .sort((a, b) => a.vence_el.localeCompare(b.vence_el))[0];
    const de = variasUnidades ? ` · ${unidad.codigo}` : '';

    if (vencidas.length > 0) {
      const total = deCentavos(sumaCentavos(vencidas.map((c) => c.saldo)));
      avisos.push({
        id: `vencidas-${unidad.unidad_id}`,
        titulo:
          vencidas.length === 1
            ? 'Tienes una cuota vencida'
            : `Tienes ${vencidas.length} cuotas vencidas`,
        detalle: `${formatoMoneda(total)}${de}`,
        vencida: true,
      });
    }
    if (proxima) {
      avisos.push({
        id: `proxima-${proxima.id}`,
        titulo: `Tu cuota de ${mesEnFrase(proxima.periodo)} está disponible`,
        detalle: `${formatoMoneda(proxima.saldo)} · vence el ${formatoFechaCorta(proxima.vence_el)}${de}`,
        vencida: false,
      });
    }
  }

  // Lo urgente primero
  return avisos.sort((a, b) => Number(b.vencida) - Number(a.vencida));
}
