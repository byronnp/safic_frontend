import { describe, expect, it } from 'vitest';

import { ICONOS } from '../icons';
import { combinarConVistasPrevias, type ItemMenu } from '../menu';

const hoja = (id: string, extra: Partial<ItemMenu> = {}): ItemMenu => ({
  id,
  etiqueta: id,
  icono: ICONOS.inicio,
  ruta: id,
  ...extra,
});

const local: ItemMenu[] = [
  hoja('inicio'),
  {
    id: 'unidades',
    etiqueta: 'Unidades',
    icono: ICONOS.unidades,
    hijos: [hoja('unidades.lista', { vistaPrevia: true }), hoja('unidades.bloques')],
  },
  {
    id: 'finanzas',
    etiqueta: 'Finanzas',
    icono: ICONOS.finanzas,
    hijos: [hoja('finanzas.resumen', { vistaPrevia: true })],
  },
];

describe('menú de la API con vistas previas', () => {
  it('suma las pantallas en vista previa en el orden del menú local', () => {
    const api: ItemMenu[] = [
      hoja('inicio'),
      {
        id: 'unidades',
        etiqueta: 'Unidades',
        icono: ICONOS.unidades,
        hijos: [hoja('unidades.bloques')],
      },
    ];

    const menu = combinarConVistasPrevias(api, local);

    expect(menu.map((i) => i.id)).toEqual(['inicio', 'unidades', 'finanzas']);
    expect(menu[1]?.hijos?.map((i) => i.id)).toEqual(['unidades.lista', 'unidades.bloques']);
  });

  it('no agrega pantallas reales que la API no dio (el perfil no las tiene)', () => {
    const menu = combinarConVistasPrevias([hoja('inicio')], local);

    expect(menu[1]?.hijos?.map((i) => i.id)).toEqual(['unidades.lista']);
  });

  it('respeta lo que viene de la API y deja al final lo que el local no conoce', () => {
    const api = [hoja('inicio', { etiqueta: 'Mi inicio' }), hoja('nueva.pantalla')];

    const menu = combinarConVistasPrevias(api, local);

    expect(menu[0]?.etiqueta).toBe('Mi inicio');
    expect(menu.at(-1)?.id).toBe('nueva.pantalla');
  });

  it('sin vistas previas en el local, devuelve el menú de la API', () => {
    const api = [hoja('inicio')];

    expect(combinarConVistasPrevias(api, [hoja('inicio'), hoja('bloques')])).toEqual(api);
  });
});
