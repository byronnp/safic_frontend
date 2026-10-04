import { describe, expect, it } from 'vitest';

import { ICONOS } from '../icons';
import {
  combinarConVistasPrevias,
  normalizarMenu,
  permisoDeRuta,
  puedeVerVistaPrevia,
  type ItemMenu,
} from '../menu';

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

describe('vistas previas por perfil', () => {
  const conPermisos = [
    hoja('inicio'),
    {
      id: 'finanzas',
      etiqueta: 'Finanzas',
      icono: ICONOS.finanzas,
      hijos: [
        hoja('finanzas.resumen', { vistaPrevia: true, permiso: 'finanzas.ver' }),
        hoja('finanzas.pagos', { vistaPrevia: true, permiso: 'pagos.aprobar' }),
      ],
    },
  ];

  it('un residente (sin permisos) solo ve lo que da la API', () => {
    const acceso = { accesoTotal: false, tienePermiso: () => false };
    const menu = combinarConVistasPrevias([hoja('inicio')], conPermisos, (i) =>
      puedeVerVistaPrevia(i.permiso, acceso),
    );

    expect(menu.map((i) => i.id)).toEqual(['inicio']);
  });

  it('el administrador ve todas las vistas previas', () => {
    const acceso = { accesoTotal: true, tienePermiso: () => false };
    const menu = combinarConVistasPrevias([hoja('inicio')], conPermisos, (i) =>
      puedeVerVistaPrevia(i.permiso, acceso),
    );

    expect(menu[1]?.hijos?.map((i) => i.id)).toEqual(['finanzas.resumen', 'finanzas.pagos']);
  });

  it('otro perfil ve solo las vistas previas de sus permisos', () => {
    const acceso = { accesoTotal: false, tienePermiso: (p: string) => p === 'pagos.aprobar' };
    const menu = combinarConVistasPrevias([hoja('inicio')], conPermisos, (i) =>
      puedeVerVistaPrevia(i.permiso, acceso),
    );

    expect(menu[1]?.hijos?.map((i) => i.id)).toEqual(['finanzas.pagos']);
  });

  it('una vista previa sin permiso declarado es solo para acceso total', () => {
    expect(puedeVerVistaPrevia(undefined, { accesoTotal: false, tienePermiso: () => true })).toBe(
      false,
    );
  });

  it('encuentra el permiso del ítem por su ruta', () => {
    expect(permisoDeRuta(conPermisos, 'finanzas.pagos')).toBe('pagos.aprobar');
    expect(permisoDeRuta(conPermisos, 'no.existe')).toBeUndefined();
  });
});

describe('limpieza del menú de la API', () => {
  const existe = (ruta: string) => ['inicio', 'bloques'].includes(ruta);

  it('cambia íconos que no son Material Symbols por uno genérico', () => {
    const menu = normalizarMenu(
      [hoja('inicio', { icono: 'img:https://malicioso.com/x.png' })],
      existe,
    );

    expect(menu[0]?.icono).toBe(ICONOS.vacio);
  });

  it('descarta hojas con rutas que el frontend no tiene y grupos vacíos', () => {
    const menu = normalizarMenu(
      [
        hoja('inicio'),
        { id: 'g', etiqueta: 'G', icono: ICONOS.unidades, hijos: [hoja('no-existe')] },
        { id: 'u', etiqueta: 'U', icono: ICONOS.unidades, hijos: [hoja('bloques'), hoja('otra')] },
      ],
      existe,
    );

    expect(menu.map((i) => i.id)).toEqual(['inicio', 'u']);
    expect(menu[1]?.hijos?.map((i) => i.id)).toEqual(['bloques']);
  });
});
