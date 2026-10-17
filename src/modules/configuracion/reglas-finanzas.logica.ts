import { aCentavos, deCentavos } from '@/utils/dinero';

import type { ReglasFinanzas } from './services/reglas-finanzas.service';

export interface FormularioReglas {
  umbral: string;
  aprobadorPuedePagar: boolean;
  tolerancia: string;
  diasGracia: string;
  mesesRestriccion: string;
  diasAviso: string;
}

export type ErroresReglas = Partial<
  Record<
    'umbral' | 'tolerancia' | 'diasGracia' | 'mesesRestriccion' | 'diasAviso',
    string | undefined
  >
>;

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
    diasGracia: String(r.dias_gracia),
    mesesRestriccion: String(r.meses_restriccion),
    diasAviso: String(r.dias_aviso_restriccion),
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
  const entero = (texto: string, min: number, max: number): boolean =>
    /^\d{1,2}$/.test(texto.trim()) && Number(texto) >= min && Number(texto) <= max;
  if (!entero(f.diasGracia, 0, 30)) e.diasGracia = 'Escribe de 0 a 30 días.';
  if (!entero(f.mesesRestriccion, 1, 12)) e.mesesRestriccion = 'Escribe de 1 a 12 meses.';
  if (!entero(f.diasAviso, 1, 30)) e.diasAviso = 'Escribe de 1 a 30 días.';
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
  if (Number(f.diasGracia) !== original.dias_gracia) c.dias_gracia = Number(f.diasGracia);
  if (Number(f.mesesRestriccion) !== original.meses_restriccion)
    c.meses_restriccion = Number(f.mesesRestriccion);
  if (Number(f.diasAviso) !== original.dias_aviso_restriccion)
    c.dias_aviso_restriccion = Number(f.diasAviso);
  return c;
}
