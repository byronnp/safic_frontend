import { describe, expect, it } from 'vitest';

import {
  filtrarMenu,
  MENU_APP_GUARDIA,
  MENU_APP_RESIDENTE,
  MENU_BASE,
  MENU_PLATAFORMA,
  type ItemMenu,
} from '../menu';

const recorrer = (items: ItemMenu[]): ItemMenu[] =>
  items.flatMap((item) => [item, ...recorrer(item.hijos ?? [])]);

describe('menú lateral', () => {
  it('todos los ítems tienen ícono Material Symbols Rounded', () => {
    const todos = [MENU_BASE, MENU_PLATAFORMA, MENU_APP_RESIDENTE, MENU_APP_GUARDIA].flatMap(
      recorrer,
    );
    for (const item of todos) {
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

  it('las vistas previas solo aparecen si se piden', () => {
    const sin = filtrarMenu(MENU_BASE, []).map((i) => i.id);
    const con = filtrarMenu(MENU_BASE, [], { vistasPrevias: true }).map((i) => i.id);
    expect(sin).not.toContain('finanzas');
    expect(con).toContain('finanzas');
  });

  it('no modifica el menú original', () => {
    const antes = JSON.stringify(MENU_BASE);
    filtrarMenu(MENU_BASE, []);
    expect(JSON.stringify(MENU_BASE)).toBe(antes);
  });
});
