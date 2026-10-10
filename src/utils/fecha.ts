/** Fecha de hoy en la hora de Ecuador (la del condominio): "2026-10-09". */
export function hoyEcuador(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

/** "2026-10-09" → "2026-10" */
export function mesDe(fecha: string): string {
  return fecha.slice(0, 7);
}

/** Suma (o resta) días a una fecha `YYYY-MM-DD` sin depender de la zona del navegador. */
export function sumarDias(fecha: string, dias: number): string {
  const [a = 0, m = 1, d = 1] = fecha.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

/** Resta meses a una fecha `YYYY-MM-DD`, dejando el día 1 del mes resultante. */
export function inicioDeMesAtras(fecha: string, meses: number): string {
  const [a = 0, m = 1] = fecha.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1 - meses, 1));
  return f.toISOString().slice(0, 10);
}
