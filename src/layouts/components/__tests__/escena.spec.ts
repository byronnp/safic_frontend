import { describe, expect, it } from 'vitest';

import { EDIFICIOS, SUELO, ventanas } from '../escena';

describe('escena del login', () => {
  it('genera siempre las mismas ventanas', () => {
    expect(ventanas()).toEqual(ventanas());
  });

  it('pone cada ventana dentro de un edificio y sobre el suelo', () => {
    for (const v of ventanas()) {
      const dentro = EDIFICIOS.some(
        (e) => v.x >= e.x && v.x + 16 <= e.x + e.ancho && v.y >= e.y && v.y + 20 <= SUELO,
      );
      expect(dentro).toBe(true);
    }
  });

  it('enciende algunas ventanas, no todas', () => {
    const lista = ventanas();
    const encendidas = lista.filter((v) => v.encendida).length;
    expect(encendidas).toBeGreaterThan(0);
    expect(encendidas).toBeLessThan(lista.length);
  });
});
