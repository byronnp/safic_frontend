import { describe, expect, it } from 'vitest';

import {
  entradaDeApp,
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

  it('con unidades.ver aparece el grupo Unidades con la lista y Bloques', () => {
    const menu = filtrarMenu(MENU_BASE, ['unidades.ver']);
    const unidades = menu.find((i) => i.id === 'unidades');
    expect(unidades?.hijos?.map((h) => h.id)).toEqual(['unidades.lista', 'unidades.bloques']);
  });

  it('las vistas previas solo aparecen si se piden', () => {
    const sin = filtrarMenu(MENU_BASE, []).map((i) => i.id);
    const con = filtrarMenu(MENU_BASE, [], { vistasPrevias: true }).map((i) => i.id);
    // Asambleas (Fase 5) aún no tiene API: solo se ve en vista previa
    expect(sin).not.toContain('asambleas');
    expect(con).toContain('asambleas');
  });

  it('no modifica el menú original', () => {
    const antes = JSON.stringify(MENU_BASE);
    filtrarMenu(MENU_BASE, []);
    expect(JSON.stringify(MENU_BASE)).toBe(antes);
  });
});

describe('entrada de las apps', () => {
  it('el residente entra por la primera pestaña real que le permiten sus permisos (nunca «Mi hogar», que es vista previa)', () => {
    expect(entradaDeApp(MENU_APP_RESIDENTE, ['cuenta.propia', 'avisos.propios'])).toBe(
      'app-mi-cuenta',
    );
    expect(entradaDeApp(MENU_APP_RESIDENTE, ['avisos.propios', 'visitas.propias'])).toBe(
      'app-avisos',
    );
    expect(entradaDeApp(MENU_APP_RESIDENTE, ['visitas.propias'])).toBe('app-mis-visitas');
    // Un residente con los 6 permisos del rol
    expect(
      entradaDeApp(MENU_APP_RESIDENTE, [
        'cuenta.propia',
        'reservas.propias',
        'visitas.propias',
        'paquetes.propios',
        'avisos.propios',
        'incidencias.reportar',
      ]),
    ).toBe('app-mi-cuenta');
  });

  it('sin ningún permiso de la app va a «sin permiso»', () => {
    expect(entradaDeApp(MENU_APP_RESIDENTE, [])).toBe('sin-permiso');
    expect(entradaDeApp(MENU_APP_GUARDIA, [])).toBe('sin-permiso');
    // Los permisos de otra app no abren esta
    expect(entradaDeApp(MENU_APP_RESIDENTE, ['garita.registrar'])).toBe('sin-permiso');
  });

  it('el guardia entra por su primera pestaña permitida', () => {
    expect(entradaDeApp(MENU_APP_GUARDIA, ['garita.registrar', 'paquetes.gestionar'])).toBe(
      'guardia-garita',
    );
    expect(entradaDeApp(MENU_APP_GUARDIA, ['paquetes.gestionar', 'garita.directorio'])).toBe(
      'guardia-paquetes',
    );
    expect(entradaDeApp(MENU_APP_GUARDIA, ['garita.directorio'])).toBe('guardia-directorio');
  });
});
