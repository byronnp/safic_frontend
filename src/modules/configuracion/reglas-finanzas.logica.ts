import { aCentavos, deCentavos } from '@/utils/dinero';

import type { ReglasFinanzas } from './services/reglas-finanzas.service';

export interface FormularioReglas {
  umbral: string;
  aprobadorPuedePagar: boolean;
  tolerancia: string;
}

export type ErroresReglas = Partial<Record<'umbral' | 'tolerancia', string | undefined>>;

/** "1.200,5" o "1200.5" → "1200.50"; '' si no es un monto con hasta dos decimales. */
export function montoNormalizado(texto: string): string {
  const limpio = texto.trim().replace(/\s|\$/g, '');
  const conPunto = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio;
  return /^\d{1,8}(\.\d{1,2})?$/.test(conPunto) ? deCentavos(aCentavos(conPunto)) : '';
}

export function formularioDeReglas(r: ReglasFinanzas): FormularioReglas {
  return {
    umbral: r.umbral_segunda_aprobacion,
    aprobadorPuedePagar: r.aprobador_puede_pagar,
    tolerancia: r.tolerancia_bancaria,
  };
}

export function validarReglas(f: FormularioReglas): ErroresReglas {
  const e: ErroresReglas = {};
  const umbral = montoNormalizado(f.umbral);
  if (umbral === '' || aCentavos(umbral) <= 0)
    e.umbral = 'Escribe un monto mayor a cero, con hasta dos decimales.';
  const tolerancia = montoNormalizado(f.tolerancia);
  if (tolerancia === '' || aCentavos(tolerancia) > 500)
    e.tolerancia = 'Escribe un valor de $ 0,00 a $ 5,00.';
  return e;
}

/** Solo lo que cambió respecto a lo guardado. */
export function cambiosDeReglas(
  original: ReglasFinanzas,
  f: FormularioReglas,
): Partial<ReglasFinanzas> {
  const c: Partial<ReglasFinanzas> = {};
  const umbral = montoNormalizado(f.umbral);
  const tolerancia = montoNormalizado(f.tolerancia);
  if (umbral !== original.umbral_segunda_aprobacion) c.umbral_segunda_aprobacion = umbral;
  if (f.aprobadorPuedePagar !== original.aprobador_puede_pagar)
    c.aprobador_puede_pagar = f.aprobadorPuedePagar;
  if (tolerancia !== original.tolerancia_bancaria) c.tolerancia_bancaria = tolerancia;
  return c;
}
