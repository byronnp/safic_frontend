/**
 * Utilidades de color para la apariencia por condominio.
 * Regla: el texto blanco sobre el color primario debe cumplir WCAG AA (4.5:1).
 * Si el color elegido no cumple, se oscurece automáticamente.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function esHexValido(valor: string): boolean {
  return HEX.test(valor.trim());
}

export function hexARgb(hex: string): Rgb {
  const coincidencia = HEX.exec(hex.trim());
  if (!coincidencia?.[1]) {
    throw new Error(`Color no válido: ${hex}`);
  }
  let valor = coincidencia[1];
  if (valor.length === 3) {
    valor = [...valor].map((c) => c + c).join('');
  }
  const numero = parseInt(valor, 16);
  return { r: (numero >> 16) & 255, g: (numero >> 8) & 255, b: numero & 255 };
}

export function rgbAHex({ r, g, b }: Rgb): string {
  const canal = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${canal(r)}${canal(g)}${canal(b)}`.toUpperCase();
}

/** Luminancia relativa (WCAG 2.x). */
export function luminancia(hex: string): number {
  const { r, g, b } = hexARgb(hex);
  const lineal = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}

/** Relación de contraste entre dos colores (1 a 21). */
export function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (claro + 0.05) / (oscuro + 0.05);
}

/** Mezcla el color con negro. `cantidad` entre 0 y 1. */
export function oscurecer(hex: string, cantidad: number): string {
  const { r, g, b } = hexARgb(hex);
  const f = 1 - Math.min(1, Math.max(0, cantidad));
  return rgbAHex({ r: r * f, g: g * f, b: b * f });
}

/**
 * Devuelve `color` o la versión más cercana (oscurecida) que alcance el
 * contraste mínimo contra `fondo`. Por defecto: texto blanco, 4.5:1.
 */
export function asegurarContraste(color: string, fondo = '#FFFFFF', minimo = 4.5): string {
  let actual = rgbAHex(hexARgb(color));
  for (let paso = 0; paso < 40 && contraste(actual, fondo) < minimo; paso++) {
    actual = oscurecer(actual, 0.05);
  }
  return actual;
}
