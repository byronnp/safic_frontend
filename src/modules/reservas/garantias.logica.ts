import { formatoFecha, formatoMoneda } from '@/utils/formato';

import type {
  DevolverGarantia,
  EstadoGarantia,
  FormaDevolucion,
  GarantiaReserva,
} from './services/garantias.service';

export const FORMAS_DEVOLUCION: { valor: FormaDevolucion; titulo: string }[] = [
  { valor: 'efectivo', titulo: 'Efectivo' },
  { valor: 'transferencia', titulo: 'Transferencia' },
];

export const textoForma = (forma: FormaDevolucion | null): string =>
  FORMAS_DEVOLUCION.find((f) => f.valor === forma)?.titulo ?? '';

/** Lo que se dice de una garantía en la lista de la administración. */
export function textoEstadoGarantia(
  g: Pick<GarantiaReserva, 'estado' | 'monto' | 'devolucion'>,
): string {
  switch (g.estado) {
    case 'esperando_decision':
      return 'Falta decidir los daños';
    case 'por_devolver':
      return `Por devolver ${formatoMoneda(g.monto)}`;
    case 'devuelta': {
      const cuando = g.devolucion?.fecha ? ` el ${formatoFecha(g.devolucion.fecha)}` : '';
      const como = g.devolucion?.forma ? ` · ${textoForma(g.devolucion.forma).toLowerCase()}` : '';
      return `Devuelta ${formatoMoneda(g.monto)}${cuando}${como}`;
    }
  }
}

/** Lo que ve el residente de su garantía (null si no hay nada que decirle). */
export function textoGarantiaResidente(r: {
  garantia_estado: EstadoGarantia | 'sin_devolucion' | null;
  garantia_monto: string | null;
  garantia_devuelta_en: string | null;
}): string | null {
  switch (r.garantia_estado) {
    case 'esperando_decision':
      return 'Tu garantía está en revisión por los daños reportados.';
    case 'por_devolver':
      return `Tu garantía de ${formatoMoneda(r.garantia_monto ?? '0')} se devolverá pronto.`;
    case 'devuelta':
      return `Garantía de ${formatoMoneda(r.garantia_monto ?? '0')} devuelta${
        r.garantia_devuelta_en ? ` el ${formatoFecha(r.garantia_devuelta_en)}` : ''
      }.`;
    case 'sin_devolucion':
      return 'La garantía cubrió los daños reportados.';
    default:
      return null;
  }
}

export interface FormularioDevolucion {
  forma: FormaDevolucion | null;
  fecha: string;
  referencia: string;
}

export type ErroresDevolucion = Partial<
  Record<'forma' | 'fecha' | 'referencia', string | undefined>
>;

export const devolucionVacia = (hoy: string): FormularioDevolucion => ({
  forma: null,
  fecha: hoy,
  referencia: '',
});

/** `hoy` y `fechaUso` son `YYYY-MM-DD`: la devolución no puede ser futura ni anterior al uso del área. */
export function validarDevolucion(
  f: FormularioDevolucion,
  hoy: string,
  fechaUso: string,
): ErroresDevolucion {
  const e: ErroresDevolucion = {};
  if (f.forma === null) e.forma = 'Indica cómo se devolvió el dinero.';
  if (f.fecha === '') e.fecha = 'Indica el día de la devolución.';
  else if (f.fecha > hoy) e.fecha = 'La fecha no puede ser futura.';
  else if (f.fecha < fechaUso) e.fecha = 'No puede ser anterior al uso del área.';
  if (f.forma === 'transferencia' && f.referencia.trim() === '') {
    e.referencia = 'Anota el número de la transferencia.';
  }
  if (f.referencia.trim().length > 40) e.referencia = 'Máximo 40 caracteres.';
  return e;
}

/** Lo que se envía a la API (ya validado). */
export function aDevolucion(f: FormularioDevolucion): DevolverGarantia {
  const referencia = f.referencia.trim();
  return {
    forma: f.forma as FormaDevolucion,
    fecha: f.fecha,
    ...(referencia !== '' ? { referencia } : {}),
  };
}
