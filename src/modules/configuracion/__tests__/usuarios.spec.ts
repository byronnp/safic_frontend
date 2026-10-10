import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesUsuarios } from '../composables/useUsuarios';
import {
  usuariosService,
  type CupoUsuarios,
  type UsuarioCondominio,
} from '../services/usuarios.service';
import {
  cambiosUsuario,
  ESTADOS,
  FORMULARIO_INVITAR_VACIO,
  formularioUsuarioDesde,
  haySinCupo,
  hoyEcuador,
  peticionInvitar,
  porcentajeCupo,
  requiereVigencia,
  textoCupo,
  textoRoles,
  validarInvitar,
  validarUsuario,
} from '../usuarios.logica';

afterEach(() => vi.restoreAllMocks());

function usuario(cambios: Partial<UsuarioCondominio> = {}): UsuarioCondominio {
  return {
    id: 5,
    nombre: 'Carlos Mera',
    email: 'carlos@example.com',
    celular: null,
    roles: ['guardia'],
    perfil: 'guardia',
    cuenta_cupo: false,
    estado: 'activo',
    acceso_hasta: null,
    es_yo: false,
    doble_factor: false,
    ...cambios,
  };
}

const HOY = '2026-10-09';

describe('servicio de usuarios', () => {
  it('lista el equipo con el cupo que viene en meta', async () => {
    const cupo: CupoUsuarios = { plan: 'Profesional', limite: 3, usados: 1 };
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ data: { data: [usuario()], meta: { cupo } } });

    const lista = await usuariosService.listar();

    expect(get).toHaveBeenCalledWith('/usuarios');
    expect(lista.usuarios[0]?.nombre).toBe('Carlos Mera');
    expect(lista.cupo).toEqual(cupo);
  });

  it('invita, edita y reenvía en sus rutas', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: usuario() } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: usuario() } });

    await usuariosService.invitar(
      peticionInvitar({
        ...FORMULARIO_INVITAR_VACIO,
        nombre: 'Ana',
        cedula: '1712345675',
        email: 'ANA@x.ec',
      }),
    );
    expect(post).toHaveBeenCalledWith(
      '/usuarios',
      expect.objectContaining({ email: 'ana@x.ec', rol: 'guardia' }),
    );

    await usuariosService.actualizar(5, { activo: false });
    expect(patch).toHaveBeenCalledWith('/usuarios/5', { activo: false });

    await usuariosService.reenviarInvitacion(5);
    expect(post).toHaveBeenLastCalledWith('/usuarios/5/invitacion');
  });

  it('la clave de caché incluye el condominio', () => {
    expect(clavesUsuarios.todos(3)).toEqual(['usuarios', 3]);
    expect(clavesUsuarios.todos(4)).not.toEqual(clavesUsuarios.todos(3));
  });
});

describe('cupo y textos', () => {
  it('calcula el uso del cupo, con o sin límite', () => {
    expect(porcentajeCupo({ plan: 'Profesional', limite: 3, usados: 1 })).toBe(33);
    expect(porcentajeCupo({ plan: 'Profesional', limite: 3, usados: 5 })).toBe(100);
    expect(porcentajeCupo({ plan: null, limite: null, usados: 4 })).toBe(0);
    expect(textoCupo({ plan: 'Profesional', limite: 3, usados: 3 })).toBe('3 de 3');
    expect(textoCupo({ plan: null, limite: null, usados: 4 })).toBe('4');
    expect(haySinCupo({ plan: 'Profesional', limite: 3, usados: 3 })).toBe(true);
    expect(haySinCupo({ plan: 'Profesional', limite: 3, usados: 2 })).toBe(false);
    expect(haySinCupo({ plan: null, limite: null, usados: 99 })).toBe(false);
  });

  it('nombra los perfiles y los estados', () => {
    expect(textoRoles(['tesorero', 'residente'])).toBe('Tesorero · Residente');
    expect(textoRoles([])).toBe('Sin perfil');
    expect(ESTADOS.pendiente.texto).toBe('Invitación pendiente');
    expect(ESTADOS.vencido.tono).toBe('error');
    expect(requiereVigencia('contador')).toBe(true);
    expect(requiereVigencia('guardia')).toBe(false);
  });

  it('la fecha de hoy es la de Ecuador, no la de UTC', () => {
    // 1 nov 03:00 UTC = 31 oct 22:00 en Guayaquil
    expect(hoyEcuador(new Date('2026-11-01T03:00:00Z'))).toBe('2026-10-31');
  });
});

describe('formulario de invitación', () => {
  const valido = {
    ...FORMULARIO_INVITAR_VACIO,
    nombre: 'Carlos Mera',
    cedula: '1712345675',
    email: 'carlos@example.com',
  };

  it('valida nombre, cédula, correo y celular', () => {
    expect(validarInvitar(valido, HOY)).toEqual({});

    const errores = validarInvitar(
      { ...valido, nombre: ' ', cedula: '1712345678', email: 'no-es-correo', celular: '123' },
      HOY,
    );
    expect(Object.keys(errores).sort()).toEqual(['cedula', 'celular', 'email', 'nombre']);
    expect(validarInvitar({ ...valido, celular: '09 8765 4321' }, HOY)).toEqual({});
  });

  it('el contador necesita una fecha futura; los demás pueden no tenerla', () => {
    expect(validarInvitar({ ...valido, rol: 'contador' }, HOY).accesoHasta).toContain(
      'necesita una fecha',
    );
    expect(
      validarInvitar({ ...valido, rol: 'contador', accesoHasta: HOY }, HOY).accesoHasta,
    ).toContain('posterior a hoy');
    expect(validarInvitar({ ...valido, rol: 'contador', accesoHasta: '2027-01-01' }, HOY)).toEqual(
      {},
    );
    expect(validarInvitar({ ...valido, rol: 'guardia', accesoHasta: '' }, HOY)).toEqual({});
  });

  it('arma la petición con el correo en minúscula y los vacíos como null', () => {
    expect(
      peticionInvitar({
        ...valido,
        email: ' Carlos@Example.COM ',
        celular: '',
        rol: 'administrador',
      }),
    ).toEqual({
      nombre: 'Carlos Mera',
      cedula: '1712345675',
      email: 'carlos@example.com',
      celular: null,
      rol: 'administrador',
      acceso_hasta: null,
    });
  });
});

describe('edición de una persona', () => {
  it('solo manda lo que cambió', () => {
    const u = usuario({ perfil: 'guardia', acceso_hasta: null });
    const f = formularioUsuarioDesde(u);

    expect(cambiosUsuario(f, u)).toEqual({});
    expect(cambiosUsuario({ ...f, perfil: 'mantenimiento' }, u)).toEqual({ rol: 'mantenimiento' });
    expect(cambiosUsuario({ ...f, accesoHasta: '2027-03-01' }, u)).toEqual({
      acceso_hasta: '2027-03-01',
    });
    expect(cambiosUsuario({ perfil: 'contador', accesoHasta: '2027-03-01' }, u)).toEqual({
      rol: 'contador',
      acceso_hasta: '2027-03-01',
    });
    expect(
      cambiosUsuario({ ...f, accesoHasta: '' }, usuario({ acceso_hasta: '2027-03-01' })),
    ).toEqual({ acceso_hasta: null });
  });

  it('quien solo tiene cargos no cambia de perfil por accidente', () => {
    const u = usuario({ perfil: null, roles: ['presidente', 'residente'] });
    expect(cambiosUsuario(formularioUsuarioDesde(u), u)).toEqual({});
  });

  it('el contador siempre conserva su fecha de vencimiento', () => {
    expect(validarUsuario({ perfil: 'contador', accesoHasta: '' }, HOY).accesoHasta).toContain(
      'necesita una fecha',
    );
    expect(
      validarUsuario({ perfil: 'contador', accesoHasta: '2026-01-01' }, HOY).accesoHasta,
    ).toContain('pasada');
    expect(validarUsuario({ perfil: 'contador', accesoHasta: HOY }, HOY)).toEqual({});
    expect(validarUsuario({ perfil: 'guardia', accesoHasta: '' }, HOY)).toEqual({});
  });
});
