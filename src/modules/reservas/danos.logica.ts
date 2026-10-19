import { aCentavos, deCentavos } from '@/utils/dinero';
import { formatoMoneda } from '@/utils/formato';

import type { DecisionDanos, ResolverDanos } from './services/danos.service';

export const OPCIONES_DECISION: { valor: DecisionDanos; titulo: string; ayuda: string }[] = [
  {
    valor: 'sin_cargo',
    titulo: 'Sin cargo',
    ayuda: 'No se cobra nada. La garantía se devuelve completa.',
  },
  {
    valor: 'descontar_garantia',
    titulo: 'Descontar de la garantía',
    ayuda: 'El daño se queda de la garantía y el resto se devuelve.',
  },
  {
    valor: 'cobrar_cuenta',
    titulo: 'Cobrar a la cuenta de la unidad',
    ayuda: 'Se crea una cuota extraordinaria. La garantía se devuelve completa.',
  },
];

export function textoDecision(decision: DecisionDanos): string {
  return OPCIONES_DECISION.find((o) => o.valor === decision)?.titulo ?? decision;
}

/** «Por devolver $ 30,00 (a mano)» · null si no hay nada que devolver o aún no se decide. */
export function textoPorDevolver(porDevolver: string | null): string | null {
  if (porDevolver === null || aCentavos(porDevolver) === 0) return null;
  return `Por devolver ${formatoMoneda(porDevolver)} de la garantía (se hace aparte)`;
}

export interface FormularioDanos {
  decision: DecisionDanos | null;
  monto: string;
  nota: string;
}

export const danosVacio = (): FormularioDanos => ({ decision: null, monto: '', nota: '' });

export type ErroresDanos = Partial<Record<'decision' | 'monto' | 'nota', string | undefined>>;

/** «12,5» o «12.50» → «12.50»; null si no es un monto válido (hasta dos decimales). */
export function normalizarMonto(texto: string): string | null {
  const t = texto.trim().replace(',', '.');
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(t)) return null;
  return deCentavos(aCentavos(t));
}

export function validarDanos(f: FormularioDanos, garantia: string): ErroresDanos {
  const e: ErroresDanos = {};
  if (f.decision === null) {
    e.decision = 'Elige qué hacer con los daños.';
    return e;
  }
  if (f.decision !== 'sin_cargo') {
    const monto = normalizarMonto(f.monto);
    if (monto === null) e.monto = 'Indica el valor del daño (hasta dos decimales).';
    else if (aCentavos(monto) <= 0) e.monto = 'El valor debe ser mayor que cero.';
    else if (f.decision === 'descontar_garantia' && aCentavos(monto) > aCentavos(garantia)) {
      e.monto = `No puede superar la garantía (${formatoMoneda(garantia)}). Cóbralo a la cuenta.`;
    }
  }
  if (f.nota.trim().length > 300) e.nota = 'Máximo 300 caracteres.';
  return e;
}

/** Lo que se envía a la API (ya validado). */
export function aSolicitud(f: FormularioDanos): ResolverDanos {
  const nota = f.nota.trim();
  return {
    decision: f.decision as DecisionDanos,
    ...(f.decision !== 'sin_cargo' ? { monto: normalizarMonto(f.monto) as string } : {}),
    ...(nota !== '' ? { nota } : {}),
  };
}
