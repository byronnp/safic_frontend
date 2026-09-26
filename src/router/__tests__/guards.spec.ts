import { describe, expect, it } from 'vitest';
import type { RouteLocationNormalized, RouteMeta } from 'vue-router';

import { guardaDeSesion, redireccionSegura, type SesionParaGuarda } from '../guards';

function ruta(fullPath: string, meta: RouteMeta = {}, name?: string): RouteLocationNormalized {
  return { fullPath, meta, name } as unknown as RouteLocationNormalized;
}

function sesion(parcial: Partial<SesionParaGuarda> = {}): SesionParaGuarda {
  return {
    autenticado: true,
    condominioId: 1,
    restaurar: () => Promise.resolve(),
    tienePermiso: () => true,
    ...parcial,
  };
}

describe('guarda de sesión', () => {
  it('sin sesión manda al login recordando el destino', async () => {
    const destino = await guardaDeSesion(ruta('/unidades/bloques'), sesion({ autenticado: false }));
    expect(destino).toEqual({ name: 'login', query: { redirect: '/unidades/bloques' } });
  });

  it('con sesión y sin condominio manda al selector', async () => {
    const destino = await guardaDeSesion(ruta('/'), sesion({ condominioId: null }));
    expect(destino).toMatchObject({ name: 'seleccionar-condominio' });
  });

  it('el selector no exige condominio', async () => {
    const destino = await guardaDeSesion(
      ruta('/condominios', { sinCondominio: true }),
      sesion({ condominioId: null }),
    );
    expect(destino).toBe(true);
  });

  it('sin el permiso de la ruta manda a "sin permiso"', async () => {
    const destino = await guardaDeSesion(
      ruta('/unidades/bloques', { permiso: 'unidades.ver' }),
      sesion({ tienePermiso: () => false }),
    );
    expect(destino).toEqual({ name: 'sin-permiso' });
  });

  it('el login con sesión activa lleva al inicio', async () => {
    const destino = await guardaDeSesion(ruta('/login', { publica: true }, 'login'), sesion());
    expect(destino).toEqual({ name: 'inicio' });
  });
});

describe('redirección segura', () => {
  it('acepta rutas internas y rechaza externas', () => {
    expect(redireccionSegura('/unidades/bloques')).toBe('/unidades/bloques');
    expect(redireccionSegura('//malicioso.com')).toBeNull();
    expect(redireccionSegura('https://malicioso.com')).toBeNull();
    expect(redireccionSegura(undefined)).toBeNull();
  });
});
