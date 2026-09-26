import { describe, expect, it } from 'vitest';

import { asegurarContraste, contraste, esHexValido, hexARgb, rgbAHex } from '../colors';
import { coloresDeMarca, TEMA_SAFIC } from '../useTenantTheme';

describe('colores', () => {
  it('convierte hex corto y largo', () => {
    expect(hexARgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexARgb('0E5E5B')).toEqual({ r: 14, g: 94, b: 91 });
    expect(rgbAHex({ r: 14, g: 94, b: 91 })).toBe('#0E5E5B');
  });

  it('valida hex', () => {
    expect(esHexValido('#0E5E5B')).toBe(true);
    expect(esHexValido('rojo')).toBe(false);
  });

  it('calcula el contraste WCAG', () => {
    expect(contraste('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contraste('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('mantiene un color que ya cumple 4.5:1 con texto blanco', () => {
    expect(asegurarContraste('#0E5E5B')).toBe('#0E5E5B');
  });

  it('oscurece un color claro hasta cumplir 4.5:1', () => {
    const ajustado = asegurarContraste('#7FD1CB');
    expect(ajustado).not.toBe('#7FD1CB');
    expect(contraste(ajustado, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('coloresDeMarca', () => {
  it('usa los colores de SAFIC si el condominio no personalizó', () => {
    expect(coloresDeMarca(null)).toEqual({
      primario: TEMA_SAFIC.primario,
      acento: TEMA_SAFIC.acento,
    });
  });

  it('ignora colores no válidos y ajusta el primario', () => {
    const colores = coloresDeMarca({ color_primario: '#FFE066', color_acento: 'azul' });
    expect(contraste(colores.primario, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(colores.acento).toBe(TEMA_SAFIC.acento);
  });
});
