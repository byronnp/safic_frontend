import { aCentavos } from '@/utils/dinero';
import { mesEnFrase, nombreMes } from '@/utils/periodo';
import type { MetodoCobro } from '@/modules/unidades/services/unidades.service';

import type {
  PeriodoFinanciero,
  ResumenFinanciero,
  TramoCartera,
} from './services/periodos.service';

export { aCentavos };

/** Porcentaje entero (0–100) de `parte` sobre `total`; 0 si no hay total. */
export function porcentaje(parte: string, total: string): number {
  const t = aCentavos(total);
  // Hacia abajo: 100 solo cuando ya se cobró todo
  return t > 0 ? Math.min(100, Math.floor((aCentavos(parte) * 100) / t)) : 0;
}

export { mesEnFrase, nombreMes };

export const NOMBRE_METODO: Record<MetodoCobro, string> = {
  general: 'valor único',
  tipo: 'valor por tipo',
  alicuota: 'por alícuota',
  unidad: 'valor por unidad',
};

export const COLOR_TRAMO: Record<TramoCartera, string> = {
  al_dia: '#0E5E5B',
  d1_30: '#C98A2B',
  d31_60: '#B8641C',
  d61_90: '#A0451A',
  d90_mas: '#9B1C12',
};

/** Tramos con el ancho de su barra relativo al mayor (como en el mockup). */
export function tramosConBarra(
  antiguedad: ResumenFinanciero['antiguedad'],
): (ResumenFinanciero['antiguedad'][number] & { ancho: number; color: string })[] {
  const mayor = Math.max(0, ...antiguedad.map((t) => aCentavos(t.saldo)));
  return antiguedad.map((t) => ({
    ...t,
    ancho: mayor > 0 ? Math.round((aCentavos(t.saldo) * 100) / mayor) : 0,
    color: COLOR_TRAMO[t.tramo],
  }));
}

/** Meses para elegir: los emitidos y, si no está entre ellos, el que se está viendo (p. ej. el mes en curso sin emitir). */
export function opcionesDeMes(
  periodos: readonly PeriodoFinanciero[],
  actual: string,
): { valor: string; etiqueta: string }[] {
  const claves = new Set(periodos.map((p) => p.periodo));
  if (actual !== '') claves.add(actual);
  return [...claves]
    .sort()
    .reverse()
    .map((valor) => ({ valor, etiqueta: nombreMes(valor) }));
}

export const ESTADO_PERIODO: Record<
  'sin_emitir' | 'abierto' | 'cerrado',
  { texto: string; tono: 'exito' | 'alerta' | 'neutro' }
> = {
  sin_emitir: { texto: 'Sin emitir', tono: 'alerta' },
  abierto: { texto: 'Periodo abierto', tono: 'exito' },
  cerrado: { texto: 'Periodo cerrado', tono: 'neutro' },
};

export function estadoDelResumen(r: ResumenFinanciero): keyof typeof ESTADO_PERIODO {
  return r.estado ?? 'sin_emitir';
}
