/**
 * Formatos de Ecuador (es-EC): dinero en USD con coma decimal, como en los
 * mockups ("$ 1.234,50"). Los montos llegan de la API como texto decimal
 * ("1234.50", decimal(12,2)); nunca se opera con float para guardar.
 */

const moneda = new Intl.NumberFormat('es-EC', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1234.5 o "1234.50" → "$ 1.234,50" */
export function formatoMoneda(valor: number | string): string {
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (!Number.isFinite(numero)) {
    return '—';
  }
  const texto = moneda.format(Math.abs(numero));
  return `${numero < 0 ? '−' : ''}$ ${texto}`;
}

/** 0.62 → "0,62 %" (el valor ya viene en porcentaje) */
export function formatoPorcentaje(valor: number, decimales = 2): string {
  return `${valor.toLocaleString('es-EC', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })} %`;
}

const fechaCorta = new Intl.DateTimeFormat('es-EC', {
  day: 'numeric',
  month: 'short',
  timeZone: 'America/Guayaquil',
});

/** "2026-09-27" o Date → "27 sept" (zona del condominio; hoy siempre Ecuador) */
export function formatoFechaCorta(valor: string | Date): string {
  const fecha = typeof valor === 'string' ? new Date(`${valor}T12:00:00`) : valor;
  return fechaCorta.format(fecha).replace('.', '');
}
