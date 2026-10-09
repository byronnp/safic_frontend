import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesMenuSistema } from '../composables/useMenuSistema';
import {
  borradorDe,
  borradorNuevo,
  cambiosDe,
  iconosOfrecidos,
  ICONOS_MENU,
  pantallasDisponibles,
  peticionNueva,
  puedeMover,
  validarBorrador,
  type RutaConocida,
} from '../menu-sistema.logica';
import { menuSistemaService, type MenuSistemaItem } from '../services/menu-sistema.service';

afterEach(() => vi.restoreAllMocks());

function item(cambios: Partial<MenuSistemaItem> = {}): MenuSistemaItem {
  return {
    id: 1,
    clave: 'configuracion.cobro',
    padre_id: 10,
    etiqueta: 'Cobro de cuotas',
    icono: 'sym_r_request_quote',
    ruta: 'configuracion-cobro',
    permiso: 'condominio.editar',
    es_grupo: false,
    seccion: false,
    orden: 20,
    activo: true,
    roles: ['administrador'],
    ...cambios,
  };
}

function ruta(cambios: Partial<RutaConocida> = {}): RutaConocida {
  return {
    name: 'bloques',
    titulo: 'Bloques',
    publica: false,
    app: false,
    conParametros: false,
    previa: false,
    ...cambios,
  };
}

describe('claves de caché', () => {
  it('son del panel de plataforma: no llevan condominio', () => {
    expect(clavesMenuSistema.menu('condominio')).toEqual([
      'plataforma',
      'menu-sistema',
      'menu',
      'condominio',
    ]);
    expect(clavesMenuSistema.previa('plataforma', 'soporte')[0]).toBe('plataforma');
  });

  it('el menú de cada ámbito tiene su propia clave', () => {
    expect(clavesMenuSistema.menu('condominio')).not.toEqual(clavesMenuSistema.menu('plataforma'));
  });
});

describe('menuSistemaService', () => {
  it('lista el menú del ámbito', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: { items: [], roles: [], permisos: [] } },
    });
    await expect(menuSistemaService.listar('plataforma')).resolves.toEqual({
      items: [],
      roles: [],
      permisos: [],
    });
    expect(get).toHaveBeenCalledWith('/plataforma/menu-sistema', {
      params: { ambito: 'plataforma' },
    });
  });

  it('crea, edita y mueve con la ruta del contrato', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: item() } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: item() } });

    await menuSistemaService.crear({ ambito: 'condominio', etiqueta: 'X', icono: 'sym_r_star' });
    await menuSistemaService.editar(7, { activo: false });
    await menuSistemaService.mover(7, 'abajo');

    expect(post).toHaveBeenNthCalledWith(1, '/plataforma/menu-sistema', expect.any(Object));
    expect(patch).toHaveBeenCalledWith('/plataforma/menu-sistema/7', { activo: false });
    expect(post).toHaveBeenNthCalledWith(2, '/plataforma/menu-sistema/7/mover', {
      direccion: 'abajo',
    });
  });

  it('pide la vista previa de un perfil', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ data: { data: { menu: [], ocultos: 2 } } });
    await expect(menuSistemaService.vistaPrevia('condominio', 'tesorero')).resolves.toEqual({
      menu: [],
      ocultos: 2,
    });
    expect(get).toHaveBeenCalledWith('/plataforma/menu-sistema/vista-previa', {
      params: { ambito: 'condominio', perfil: 'tesorero' },
    });
  });
});

describe('cambiosDe', () => {
  it('no manda nada si no cambió nada', () => {
    expect(cambiosDe(item(), borradorDe(item()))).toEqual({});
  });

  it('manda solo lo que cambió', () => {
    const b = { ...borradorDe(item()), etiqueta: '  Cobro  ', permiso: '', roles: ['contador'] };
    expect(cambiosDe(item(), b)).toEqual({ etiqueta: 'Cobro', permiso: null, roles: ['contador'] });
  });

  it('el orden de los perfiles no es un cambio', () => {
    const base = item({ roles: ['administrador', 'contador'] });
    expect(cambiosDe(base, { ...borradorDe(base), roles: ['contador', 'administrador'] })).toEqual(
      {},
    );
  });

  it('un grupo no manda ruta, permiso ni perfiles', () => {
    const grupo = item({ es_grupo: true, ruta: null, permiso: null, roles: [] });
    const b = { ...borradorDe(grupo), ruta: 'x', permiso: 'y', roles: ['z'], etiqueta: 'Nuevo' };
    expect(cambiosDe(grupo, b)).toEqual({ etiqueta: 'Nuevo' });
  });
});

describe('peticionNueva', () => {
  it('un grupo se crea como sección, sin ruta ni perfiles', () => {
    const b = { ...borradorNuevo(true), etiqueta: ' Acceso ' };
    expect(peticionNueva('plataforma', b)).toEqual({
      ambito: 'plataforma',
      etiqueta: 'Acceso',
      icono: 'sym_r_dashboard',
      activo: true,
      seccion: true,
    });
  });

  it('una pantalla lleva grupo, ruta, permiso y perfiles', () => {
    const b = {
      ...borradorNuevo(false),
      etiqueta: 'Reglamento',
      ruta: 'reglamento',
      padreId: 10,
      roles: ['administrador'],
    };
    expect(peticionNueva('condominio', b)).toMatchObject({
      padre_id: 10,
      ruta: 'reglamento',
      permiso: null,
      roles: ['administrador'],
    });
  });
});

describe('validarBorrador', () => {
  it('pide etiqueta e ícono', () => {
    const e = validarBorrador({ ...borradorNuevo(true), etiqueta: 'A', icono: '' });
    expect(e.etiqueta).toBe('Escribe la etiqueta (mínimo 2 letras).');
    expect(e.icono).toBe('Elige un ícono.');
  });

  it('una pantalla necesita su ruta; un grupo no', () => {
    const ok = { ...borradorNuevo(false), etiqueta: 'Reglamento' };
    expect(validarBorrador(ok).ruta).toBe('Elige la pantalla.');
    expect(validarBorrador({ ...ok, esGrupo: true })).toEqual({});
  });
});

describe('pantallasDisponibles', () => {
  const rutas = [
    ruta(),
    ruta({ name: 'plataforma-menu', titulo: 'Menú' }),
    ruta({ name: 'plataforma', titulo: 'Panel' }),
    ruta({ name: 'login', titulo: 'Entrar', publica: true }),
    ruta({ name: 'app-mi-hogar', titulo: 'Hogar', app: true }),
    ruta({ name: 'unidades-detalle', titulo: 'Detalle', conParametros: true }),
    ruta({ name: 'finanzas-resumen', titulo: 'Resumen', previa: true }),
    ruta({ name: 'sin-titulo', titulo: '' }),
  ];

  it('ofrece solo rutas reales del ámbito', () => {
    expect(pantallasDisponibles(rutas, 'condominio').map((p) => p.ruta)).toEqual(['bloques']);
    expect(pantallasDisponibles(rutas, 'plataforma').map((p) => p.ruta)).toEqual([
      'plataforma-menu',
    ]);
  });

  it('siempre ofrece la pantalla que el ítem ya tiene', () => {
    expect(pantallasDisponibles(rutas, 'condominio', 'vieja')[0]).toEqual({
      ruta: 'vieja',
      titulo: 'vieja',
    });
  });
});

describe('puedeMover', () => {
  const lista = [
    item({ id: 1, padre_id: 10, orden: 10 }),
    item({ id: 2, padre_id: 10, orden: 20 }),
    item({ id: 3, padre_id: null, orden: 10 }),
  ];

  it('no se sube el primero ni se baja el último entre hermanos', () => {
    expect(puedeMover(lista, lista[0]!, 'arriba')).toBe(false);
    expect(puedeMover(lista, lista[0]!, 'abajo')).toBe(true);
    expect(puedeMover(lista, lista[1]!, 'abajo')).toBe(false);
  });

  it('un ítem sin hermanos no se mueve', () => {
    expect(puedeMover(lista, lista[2]!, 'arriba')).toBe(false);
    expect(puedeMover(lista, lista[2]!, 'abajo')).toBe(false);
  });
});

describe('iconosOfrecidos', () => {
  it('agrega el ícono actual si no está en el catálogo', () => {
    expect(iconosOfrecidos('sym_r_raro')[0]).toBe('sym_r_raro');
    expect(iconosOfrecidos(ICONOS_MENU[0]!)).toBe(ICONOS_MENU);
  });
});
