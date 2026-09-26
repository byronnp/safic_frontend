import { describe, expect, it } from 'vitest';

import { filtrarMenu, MENU_BASE, type ItemMenu } from '../menu';

const recorrer = (items: ItemMenu[]): ItemMenu[] =>
  items.flatMap((item) => [item, ...recorrer(item.hijos ?? [])]);

describe('menú lateral', () => {
  it('todos los ítems tienen ícono Material Symbols Rounded', () => {
    for (const item of recorrer(MENU_BASE)) {
      expect(item.icono, item.id).toMatch(/^sym_r_[a-z0-9_]+$/);
    }
  });

  it('sin permisos solo queda Inicio', () => {
    expect(filtrarMenu(MENU_BASE, []).map((i) => i.id)).toEqual(['inicio']);
  });

  it('con unidades.ver aparece el grupo Unidades con Bloques', () => {
    const menu = filtrarMenu(MENU_BASE, ['unidades.ver']);
    const unidades = menu.find((i) => i.id === 'unidades');
    expect(unidades?.hijos?.map((h) => h.id)).toEqual(['unidades.bloques']);
  });

  it('no modifica el menú original', () => {
    const antes = JSON.stringify(MENU_BASE);
    filtrarMenu(MENU_BASE, []);
    expect(JSON.stringify(MENU_BASE)).toBe(antes);
  });
});
