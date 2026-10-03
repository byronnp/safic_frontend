import { describe, expect, it } from 'vitest';

import { ICONOS } from '../icons';
import { type ItemMenu, MENU_BASE, moduloDeRuta } from '../menu';

describe('módulo de la pantalla actual', () => {
  it('encuentra el módulo que contiene la ruta', () => {
    expect(moduloDeRuta(MENU_BASE, 'bloques')).toBe('unidades');
    expect(moduloDeRuta(MENU_BASE, 'finanzas-conciliacion')).toBe('finanzas');
  });

  it('los enlaces sueltos y las secciones fijas no son módulos', () => {
    expect(moduloDeRuta(MENU_BASE, 'inicio')).toBeNull();
    expect(moduloDeRuta(MENU_BASE, 'configuracion-usuarios')).toBeNull();
    expect(moduloDeRuta(MENU_BASE, undefined)).toBeNull();
  });

  it('funciona con el menú ya filtrado por permisos', () => {
    const menu: ItemMenu[] = [
      {
        id: 'unidades',
        etiqueta: 'Unidades',
        icono: ICONOS.unidades,
        hijos: [{ id: 'b', etiqueta: 'Bloques', icono: ICONOS.bloques, ruta: 'bloques' }],
      },
    ];
    expect(moduloDeRuta(menu, 'bloques')).toBe('unidades');
  });
});
