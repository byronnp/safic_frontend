/**
 * Dinero en centavos enteros. Los montos llegan y se envían como texto decimal ("80.00");
 * para sumar o comparar se pasan a centavos y se vuelven a texto. Nunca con decimales de float.
 */

/** "12320.50" → 1232050 (acepta hasta dos decimales). */
export function aCentavos(monto: string): number {
  const negativo = monto.startsWith('-');
  const [enteros = '0', decimales = ''] = monto.replace(/^[-+]/, '').split('.');
  const centavos = Number(enteros) * 100 + Number(decimales.padEnd(2, '0').slice(0, 2));
  return negativo ? -centavos : centavos;
}

/** 1232050 → "12320.50" */
export function deCentavos(centavos: number): string {
  const signo = centavos < 0 ? '-' : '';
  const absoluto = Math.abs(centavos);
  return `${signo}${Math.trunc(absoluto / 100)}.${String(absoluto % 100).padStart(2, '0')}`;
}

export function sumaCentavos(montos: readonly string[]): number {
  return montos.reduce((total, monto) => total + aCentavos(monto), 0);
}
