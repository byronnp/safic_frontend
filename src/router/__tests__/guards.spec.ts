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
    condominios: [{ id: 1 }],
    esPlataforma: false,
    restaurar: () => Promise.resolve(),
    tienePermiso: () => true,
    tienePermisoPlataforma: () => false,
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

describe('perfil de plataforma', () => {
  const superAdmin = (parcial: Partial<SesionParaGuarda> = {}): SesionParaGuarda =>
    sesion({
      condominioId: null,
      condominios: [],
      esPlataforma: true,
      tienePermisoPlataforma: () => true,
      ...parcial,
    });

  it('el super admin sin condominios entra a su panel, no al selector', async () => {
    expect(await guardaDeSesion(ruta('/'), superAdmin())).toEqual({ name: 'plataforma' });
    expect(
      await guardaDeSesion(
        ruta('/condominios', { sinCondominio: true }, 'seleccionar-condominio'),
        superAdmin(),
      ),
    ).toEqual({ name: 'plataforma' });
  });

  it('el login con sesión de super admin lleva al panel', async () => {
    const destino = await guardaDeSesion(ruta('/login', { publica: true }, 'login'), superAdmin());
    expect(destino).toEqual({ name: 'plataforma' });
  });

  it('abre las pantallas de plataforma con sus propios permisos', async () => {
    const meta = { sinCondominio: true, plataforma: true, permiso: 'plataforma.cobranza' };
    expect(await guardaDeSesion(ruta('/plataforma/cobranza', meta), superAdmin())).toBe(true);
    expect(
      await guardaDeSesion(
        ruta('/plataforma/cobranza', meta),
        superAdmin({ tienePermisoPlataforma: () => false }),
      ),
    ).toEqual({ name: 'plataforma-sin-permiso' });
  });

  it('un usuario de condominio no entra al panel de plataforma', async () => {
    const destino = await guardaDeSesion(
      ruta('/plataforma/condominios', { sinCondominio: true, plataforma: true }),
      sesion({ tienePermiso: () => true }),
    );
    expect(destino).toEqual({ name: 'sin-permiso' });
  });

  it('un usuario sin condominios ni plataforma ve el selector (con el aviso)', async () => {
    const destino = await guardaDeSesion(
      ruta('/condominios', { sinCondominio: true }, 'seleccionar-condominio'),
      sesion({ condominioId: null, condominios: [] }),
    );
    expect(destino).toBe(true);
  });

  it('super admin con condominios puede elegir condominio', async () => {
    const destino = await guardaDeSesion(ruta('/'), superAdmin({ condominios: [{ id: 3 }] }));
    expect(destino).toMatchObject({ name: 'seleccionar-condominio' });
  });
});

describe('vista previa', () => {
  it('en desarrollo abre la pantalla aunque falte el permiso', async () => {
    const destino = await guardaDeSesion(
      ruta('/finanzas', { vistaPrevia: true }),
      sesion({ tienePermiso: () => false }),
      { vistasPrevias: true },
    );
    expect(destino).toBe(true);
  });

  it('en producción no se abre', async () => {
    const destino = await guardaDeSesion(ruta('/finanzas', { vistaPrevia: true }), sesion(), {
      vistasPrevias: false,
    });
    expect(destino).toEqual({ name: 'sin-permiso' });
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
