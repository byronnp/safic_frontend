import { aCentavos } from '@/utils/dinero';
import { mesDe } from '@/utils/fecha';
import { nombreMes } from '@/utils/periodo';

import type { EstadoVerificacion, Verificacion } from './services/cierre-mes.service';
import type { PeriodoFinanciero } from './services/periodos.service';

export const ESTADO_VERIFICACION: Record<
  EstadoVerificacion,
  { texto: string; icono: string; tono: 'exito' | 'alerta' | 'error' }
> = {
  listo: { texto: 'Listo', icono: 'sym_r_check_circle', tono: 'exito' },
  revisar: { texto: 'Revisar', icono: 'sym_r_warning', tono: 'alerta' },
  bloquea: { texto: 'Bloquea el cierre', icono: 'sym_r_error', tono: 'error' },
};

/** "5 de 6 puntos listos" */
export function textoAvance(verificaciones: readonly Verificacion[]): string {
  const listos = verificaciones.filter((v) => v.estado === 'listo').length;
  return `${listos} de ${verificaciones.length} puntos listos`;
}

/** Mes a mostrar al abrir la pantalla: el más antiguo que ya terminó y sigue abierto; si no, el último mes del anterior. */
export function mesPorCerrar(periodos: readonly PeriodoFinanciero[], hoy: string): string {
  const actual = mesDe(hoy);
  const abiertos = periodos
    .filter((p) => p.estado === 'abierto' && p.periodo < actual)
    .map((p) => p.periodo)
    .sort();
  if (abiertos[0]) return abiertos[0];
  const todos = periodos.map((p) => p.periodo).sort();
  return todos.at(-1) ?? mesAnterior(actual);
}

export function mesAnterior(periodo: string): string {
  const [a = 0, m = 1] = periodo.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 2, 1));
  return f.toISOString().slice(0, 7);
}

export function tituloCierre(periodo: string, cerrado: boolean): string {
  return `${cerrado ? 'Mes cerrado:' : 'Cerrar'} ${nombreMes(periodo).toLowerCase()}`;
}

/** Cobrado sobre emitido, en porcentaje entero (0 si no se emitió nada). */
export function porcentajeCobrado(emitido: string, cobrado: string): number {
  const e = aCentavos(emitido);
  return e > 0 ? Math.min(100, Math.floor((aCentavos(cobrado) * 100) / e)) : 0;
}

export function validarMotivoReapertura(motivo: string): string | undefined {
  const m = motivo.trim();
  if (m === '') return 'Escribe el motivo de la reapertura.';
  return m.length < 3 ? 'El motivo es muy corto.' : undefined;
}
