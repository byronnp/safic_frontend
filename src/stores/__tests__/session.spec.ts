import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RespuestaToken } from '@/core/api/types';
import { authService } from '@/core/auth/auth.service';

import { useSessionStore } from '../session';

function token(condominios: number[]): RespuestaToken {
  return {
    access_token: 'jwt',
    token_type: 'Bearer',
    expires_in: 900,
    usuario: {
      id: 1,
      nombre: 'María Pérez',
      email: 'maria@jardinesdelvalle.ec',
      condominios: condominios.map((id) => ({
        id,
        codigo: `C${id}`,
        nombre: `Condominio ${id}`,
        es_principal: id === condominios[0],
        estado: 'activo',
        marca: null,
      })),
    },
  };
}

describe('sesión', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.spyOn(authService, 'contexto').mockImplementation((id) =>
      Promise.resolve({ condominio_id: id, roles: ['administrador'], permisos: ['unidades.ver'] }),
    );
  });

  it('con un solo condominio lo selecciona y carga sus permisos', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue(token([5]));
    const session = useSessionStore();

    await session.iniciarSesion('maria@jardinesdelvalle.ec', 'secreto');

    expect(session.autenticado).toBe(true);
    expect(session.condominioId).toBe(5);
    expect(session.tienePermiso('unidades.ver')).toBe(true);
    expect(session.tienePermiso('unidades.editar')).toBe(false);
  });

  it('con varios condominios pide elegir, salvo que haya uno recordado', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue(token([5, 9]));
    const session = useSessionStore();

    await session.iniciarSesion('maria@jardinesdelvalle.ec', 'secreto');
    expect(session.condominioId).toBeNull();

    await session.seleccionarCondominio(9);
    expect(localStorage.getItem('safic.condominio')).toBe('9');

    setActivePinia(createPinia());
    const otra = useSessionStore();
    await otra.iniciarSesion('maria@jardinesdelvalle.ec', 'secreto');
    expect(otra.condominioId).toBe(9);
  });

  it('no permite elegir un condominio ajeno', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue(token([5]));
    const session = useSessionStore();
    await session.iniciarSesion('maria@jardinesdelvalle.ec', 'secreto');

    await expect(session.seleccionarCondominio(99)).rejects.toThrow();
    expect(session.condominioId).toBe(5);
  });

  it('el access token nunca se guarda en localStorage', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue(token([5]));
    await useSessionStore().iniciarSesion('maria@jardinesdelvalle.ec', 'secreto');

    const todo = Object.keys(localStorage)
      .map((k) => localStorage.getItem(k))
      .join('|');
    expect(todo).not.toContain('jwt');
  });

  it('si el refresh falla al recargar, queda sin sesión', async () => {
    vi.spyOn(authService, 'refrescar').mockRejectedValue(new Error('401'));
    const session = useSessionStore();

    await session.restaurar();

    expect(session.autenticado).toBe(false);
    expect(session.restaurada).toBe(true);
  });

  it('al cerrar sesión limpia todo aunque la API falle', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue(token([5]));
    vi.spyOn(authService, 'logout').mockRejectedValue(new Error('red'));
    const session = useSessionStore();
    await session.iniciarSesion('maria@jardinesdelvalle.ec', 'secreto');

    await session.cerrarSesion().catch(() => undefined);

    expect(session.autenticado).toBe(false);
    expect(session.permisos).toEqual([]);
    expect(localStorage.getItem('safic.condominio')).toBeNull();
  });
});
