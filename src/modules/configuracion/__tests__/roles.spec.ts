import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesRoles } from '../composables/useRoles';
import {
  agruparPermisos,
  agruparRoles,
  avisoRol,
  iconoRol,
  iconoSeguro,
  textoUsuarios,
  validarSolicitud,
} from '../roles.logica';
import {
  rolesService,
  type PermisoCatalogo,
  type RolCondominio,
  type RolesCondominio,
} from '../services/roles.service';

afterEach(() => vi.restoreAllMocks());

function rol(cambios: Partial<RolCondominio> = {}): RolCondominio {
  return {
    clave: 'guardia',
    nombre: 'Guardia',
    tipo: 'sistema',
    cuenta_cupo: false,
    usuarios: 1,
    permisos: ['unidades.ver'],
    menu: [{ etiqueta: 'Unidades', icono: 'sym_r_apartment' }],
    ...cambios,
  };
}

const CUPO = { plan: 'Profesional', limite: 3, usados: 2 };

describe('servicio de roles', () => {
  it('lista los roles y pide uno nuevo en sus rutas', async () => {
    const datos: RolesCondominio = { roles: [rol()], permisos: [], cupo: CUPO };
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: datos } });
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { data: { id: 1, nombre: 'Jardinero', estado: 'pendiente' } } });

    expect((await rolesService.listar()).roles[0]?.clave).toBe('guardia');
    expect(get).toHaveBeenCalledWith('/roles');

    const pedido = { nombre: 'Jardinero', descripcion: 'Reportar incidencias de áreas verdes' };
    expect((await rolesService.solicitar(pedido)).estado).toBe('pendiente');
    expect(post).toHaveBeenCalledWith('/roles/solicitudes', pedido);
  });

  it('la clave de caché incluye el condominio', () => {
    expect(clavesRoles.todos(3)).toEqual(['roles', 3]);
    expect(clavesRoles.todos(4)).not.toEqual(clavesRoles.todos(3));
  });
});

describe('lista de roles', () => {
  it('agrupa como el mockup y omite los grupos vacíos', () => {
    const roles = [
      rol({ clave: 'administrador', nombre: 'Administrador' }),
      rol({ clave: 'presidente', nombre: 'Presidente', tipo: 'cargo' }),
    ];

    const grupos = agruparRoles(roles);

    expect(grupos.map((g) => g.titulo)).toEqual(['SISTEMA', 'CARGOS DE DIRECTIVA']);
    expect(grupos[1]?.roles[0]?.clave).toBe('presidente');
    expect(agruparRoles([rol({ tipo: 'adicional' })]).map((g) => g.titulo)).toEqual([
      'ADICIONALES DE LA PLATAFORMA',
    ]);
  });

  it('elige el ícono: candado para los cargos, genérico para los roles nuevos', () => {
    expect(iconoRol({ clave: 'administrador', tipo: 'sistema' })).toBe('sym_r_shield');
    expect(iconoRol({ clave: 'presidente', tipo: 'cargo' })).toBe('sym_r_lock');
    expect(iconoRol({ clave: 'conserje', tipo: 'adicional' })).toBe('sym_r_person');
  });

  it('solo acepta nombres de ícono de Material Symbols', () => {
    expect(iconoSeguro('sym_r_apartment')).toBe('sym_r_apartment');
    expect(iconoSeguro('img:https://sitio.example/x.png')).toBe('sym_r_circle');
    expect(iconoSeguro('https://sitio.example/x.svg')).toBe('sym_r_circle');
    expect(iconoSeguro('svguse:/x.svg#a')).toBe('sym_r_circle');
    expect(iconoSeguro('')).toBe('sym_r_circle');
  });

  it('pluraliza las personas con el rol', () => {
    expect(textoUsuarios(1)).toBe('1 usuario');
    expect(textoUsuarios(0)).toBe('0 usuarios');
    expect(textoUsuarios(146)).toBe('146 usuarios');
  });
});

describe('permisos', () => {
  it('los agrupa por módulo conservando el orden', () => {
    const permisos: PermisoCatalogo[] = [
      { clave: 'unidades.ver', etiqueta: 'Ver unidades', grupo: 'Núcleo', administrativo: false },
      {
        clave: 'garita.directorio',
        etiqueta: 'Directorio',
        grupo: 'Garita',
        administrativo: false,
      },
      {
        clave: 'unidades.editar',
        etiqueta: 'Editar unidades',
        grupo: 'Núcleo',
        administrativo: true,
      },
    ];

    const grupos = agruparPermisos(permisos);

    expect(grupos.map((g) => g.grupo)).toEqual(['Núcleo', 'Garita']);
    expect(grupos[0]?.permisos.map((p) => p.clave)).toEqual(['unidades.ver', 'unidades.editar']);
  });
});

describe('aviso del rol', () => {
  it('depende del tipo, del cupo y de la solicitud', () => {
    expect(avisoRol(rol(), CUPO, true).tono).toBe('exito');
    expect(avisoRol(rol({ tipo: 'cargo' }), CUPO, false).texto).toContain('Usuarios › Directiva');
    expect(avisoRol(rol({ cuenta_cupo: true }), CUPO, false)).toMatchObject({ tono: 'alerta' });
    expect(avisoRol(rol({ cuenta_cupo: true }), CUPO, false).texto).toContain('2 de 3 usados');
    expect(
      avisoRol(rol({ cuenta_cupo: true }), { plan: null, limite: null, usados: 4 }, false).texto,
    ).toContain('4 usados');
    expect(avisoRol(rol(), CUPO, false).tono).toBe('info');
    // La solicitud enviada gana sobre todo lo demás
    expect(avisoRol(rol({ cuenta_cupo: true }), CUPO, true).tono).toBe('exito');
  });
});

describe('solicitud de un rol', () => {
  it('pide un nombre de 3 a 60 y una descripción de 10 a 500', () => {
    expect(
      validarSolicitud({
        nombre: 'Jardinero',
        descripcion: 'Reportar incidencias de áreas verdes',
      }),
    ).toEqual({});
    expect(validarSolicitud({ nombre: '', descripcion: '' })).toEqual({
      nombre: 'Escribe el nombre sugerido para el rol.',
      descripcion: 'Cuéntanos qué debe poder hacer.',
    });
    expect(validarSolicitud({ nombre: 'ab', descripcion: 'corto' })).toEqual({
      nombre: 'El nombre tiene mínimo 3 caracteres.',
      descripcion: 'Cuéntanos un poco más: mínimo 10 caracteres.',
    });
    expect(validarSolicitud({ nombre: 'a'.repeat(61), descripcion: 'b'.repeat(501) })).toEqual({
      nombre: 'El nombre tiene máximo 60 caracteres.',
      descripcion: 'La descripción tiene máximo 500 caracteres.',
    });
  });

  it('ignora los espacios de los extremos', () => {
    expect(validarSolicitud({ nombre: '  ab  ', descripcion: '          ' }).nombre).toContain(
      'mínimo 3',
    );
    expect(
      validarSolicitud({ nombre: '  Jardinero ', descripcion: '  Reportar incidencias  ' }),
    ).toEqual({});
  });
});
