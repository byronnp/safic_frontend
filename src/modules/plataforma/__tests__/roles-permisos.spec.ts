import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesRolesAdmin } from '../composables/useRolesAdmin';
import {
  alternarPermiso,
  concedido,
  errorNombreRol,
  gruposDePermisos,
  motivoFijo,
  resumenRol,
  permisosFinales,
  rolesModificados,
  sinBorradoresResueltos,
  textoAlcance,
} from '../roles-permisos.logica';
import {
  rolesAdminService,
  type PermisoAdmin,
  type RolAdmin,
} from '../services/roles-admin.service';

afterEach(() => vi.restoreAllMocks());

function rol(cambios: Partial<RolAdmin> = {}): RolAdmin {
  return {
    clave: 'guardia',
    nombre: 'Guardia',
    tipo: 'sistema',
    condominios: 2,
    permisos: ['unidades.ver'],
    bloqueos: { 'usuarios.gestionar': 'El guardia no recibe permisos administrativos.' },
    obligatorios: [],
    ...cambios,
  };
}

function permiso(cambios: Partial<PermisoAdmin> = {}): PermisoAdmin {
  return {
    clave: 'unidades.ver',
    etiqueta: 'Ver unidades',
    grupo: 'Núcleo',
    administrativo: false,
    escritura: false,
    ...cambios,
  };
}

describe('claves de caché', () => {
  it('son del panel de plataforma: no llevan condominio', () => {
    expect(clavesRolesAdmin.matriz).toEqual(['plataforma', 'roles', 'matriz']);
  });
});

describe('rolesAdminService', () => {
  it('lista la matriz', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ data: { data: { roles: [], permisos: [], solicitudes: [] } } });
    await rolesAdminService.listar();
    expect(get).toHaveBeenCalledWith('/plataforma/roles');
  });

  it('crea un rol y guarda el conjunto completo de permisos', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: rol() } });
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { data: rol() } });

    await rolesAdminService.crear('Conserje');
    await rolesAdminService.guardarPermisos('guardia', ['unidades.ver']);

    expect(post).toHaveBeenCalledWith('/plataforma/roles', { nombre: 'Conserje', permisos: [] });
    expect(put).toHaveBeenCalledWith('/plataforma/roles/guardia/permisos', {
      permisos: ['unidades.ver'],
    });
  });
});

describe('concedido y motivoFijo', () => {
  it('un permiso bloqueado nunca cuenta como concedido', () => {
    const r = rol({ permisos: ['usuarios.gestionar'] });
    expect(concedido(r, 'usuarios.gestionar', {})).toBe(false);
    expect(motivoFijo(r, 'usuarios.gestionar', {})).toMatch(/no recibe/);
  });

  it('un obligatorio concedido no se puede quitar', () => {
    const admin = rol({
      clave: 'administrador',
      permisos: ['usuarios.gestionar'],
      bloqueos: {},
      obligatorios: ['usuarios.gestionar'],
    });
    expect(motivoFijo(admin, 'usuarios.gestionar', {})).toBe('Este rol necesita este permiso.');
    expect(motivoFijo(admin, 'unidades.ver', {})).toBe('');
  });
});

describe('alternarPermiso', () => {
  it('agrega al borrador y lo descarta si vuelve a lo guardado', () => {
    const r = rol();
    const con = alternarPermiso(r, 'garita.directorio', {});
    expect(con).toEqual({
      guardia: { base: ['unidades.ver'], permisos: ['unidades.ver', 'garita.directorio'] },
    });
    expect(alternarPermiso(r, 'garita.directorio', con)).toEqual({});
  });

  it('no cambia nada si el permiso es fijo', () => {
    const r = rol();
    const vacio = {};
    expect(alternarPermiso(r, 'usuarios.gestionar', vacio)).toBe(vacio);
  });

  it('quita un permiso concedido', () => {
    expect(alternarPermiso(rol(), 'unidades.ver', {})).toEqual({
      guardia: { base: ['unidades.ver'], permisos: [] },
    });
  });
});

describe('rolesModificados', () => {
  it('devuelve solo los roles con borrador, en el orden de la matriz', () => {
    const a = rol({ clave: 'a' });
    const b = rol({ clave: 'b' });
    expect(
      rolesModificados([a, b], { b: { base: [], permisos: ['x'] } }).map((r) => r.clave),
    ).toEqual(['b']);
  });
});

describe('resumenRol', () => {
  it('cuenta permisos y marca ADM si alguno es administrativo', () => {
    const permisos = [
      permiso(),
      permiso({ clave: 'unidades.editar', administrativo: true, escritura: true }),
    ];
    const r = rol({ bloqueos: {}, permisos: ['unidades.ver'] });
    expect(resumenRol(r, permisos, {})).toEqual({ total: 1, administrativo: false });
    expect(
      resumenRol(r, permisos, {
        guardia: { base: ['unidades.ver'], permisos: ['unidades.ver', 'unidades.editar'] },
      }),
    ).toEqual({
      total: 2,
      administrativo: true,
    });
  });
});

describe('textoAlcance', () => {
  it('dice en cuántos condominios se usa', () => {
    expect(textoAlcance(rol({ condominios: 0 }))).toBe('Sin uso');
    expect(textoAlcance(rol({ condominios: 1 }))).toBe('1 condominio');
    expect(textoAlcance(rol({ condominios: 3 }))).toBe('3 condominios');
  });
});

describe('gruposDePermisos', () => {
  const lista = [
    permiso(),
    permiso({ clave: 'garita.directorio', grupo: 'Garita' }),
    permiso({ clave: 'unidades.editar' }),
  ];

  it('agrupa por módulo y respeta el filtro', () => {
    expect(gruposDePermisos(lista, 'todos').map((g) => [g.modulo, g.permisos.length])).toEqual([
      ['Núcleo', 2],
      ['Garita', 1],
    ]);
    expect(gruposDePermisos(lista, 'Garita')).toHaveLength(1);
  });
});

describe('errorNombreRol', () => {
  it('pide entre 3 y 60 caracteres', () => {
    expect(errorNombreRol('ab')).toBe('El nombre tiene mínimo 3 caracteres.');
    expect(errorNombreRol('x'.repeat(61))).toBe('El nombre tiene máximo 60 caracteres.');
    expect(errorNombreRol('Conserje')).toBeNull();
  });
});

describe('permisosFinales', () => {
  it('aplica lo que la persona agregó y quitó sobre lo que hoy tiene el servidor', () => {
    // Al empezar tenía [a, b]; la persona quitó b y agregó c. Entretanto otro admin agregó d.
    const hoy = rol({ permisos: ['a', 'b', 'd'] });
    expect(permisosFinales(hoy, { base: ['a', 'b'], permisos: ['a', 'c'] }).sort()).toEqual([
      'a',
      'c',
      'd',
    ]);
  });
});

describe('sinBorradoresResueltos', () => {
  it('quita los borradores que ya coinciden con el servidor o de roles que ya no existen', () => {
    const r = rol({ permisos: ['a'] });
    const bs = {
      guardia: { base: [], permisos: ['a'] },
      fantasma: { base: [], permisos: ['x'] },
    };
    expect(sinBorradoresResueltos([r], bs)).toEqual({});
    expect(
      sinBorradoresResueltos([r], { guardia: { base: ['a'], permisos: ['b'] } }),
    ).toHaveProperty('guardia');
  });
});
