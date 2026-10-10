const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** "2026-09" → "Septiembre 2026" */
export function nombreMes(periodo: string): string {
  const [anio = '', mes = ''] = periodo.split('-');
  return `${MESES[Number(mes) - 1] ?? mes} ${anio}`;
}

/** "2026-09" → "septiembre" (en minúscula, para frases) */
export function mesEnFrase(periodo: string): string {
  return nombreMes(periodo).split(' ')[0]!.toLowerCase();
}
