/** Iniciales y colores de avatar (mockup: selector de condominio y usuario). */

const PALETA = [
  { fondo: '#E3EFEC', texto: '#0B4A47' },
  { fondo: '#FFF1DC', texto: '#8A3F0A' },
  { fondo: '#E6ECF7', texto: '#23407A' },
  { fondo: '#F1E8F5', texto: '#5B2A73' },
  { fondo: '#E8F3E1', texto: '#2F5A1B' },
] as const;

const PALABRAS_MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'conjunto']);

/** "Conjunto Jardines del Valle" → "JV" · "María Rodríguez" → "MR" · "Conjunto Los Arupos" → "AR". */
export function iniciales(nombre: string): string {
  const palabras = nombre.split(/\s+/).filter((p) => p && !PALABRAS_MENORES.has(p.toLowerCase()));
  const base = palabras.length > 0 ? palabras : nombre.split(/\s+/).filter(Boolean);
  if (base.length === 1) {
    return (base[0] ?? '').slice(0, 2).toUpperCase();
  }
  return base
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Color estable por id: el mismo condominio siempre tiene el mismo color. */
export function colorAvatar(id: number): { fondo: string; texto: string } {
  return PALETA[Math.abs(id) % PALETA.length]!;
}
