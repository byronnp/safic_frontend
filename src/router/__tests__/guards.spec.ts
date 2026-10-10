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
    dobleFactorPendiente: false,
    roles: ['administrador'],
    rolesPlataforma: [],
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

  it('un contador sin verificación en dos pasos solo llega a configurarla', async () => {
    const pendiente = sesion({ dobleFactorPendiente: true });

    expect(await guardaDeSesion(ruta('/finanzas', {}, 'finanzas-resumen'), pendiente)).toEqual({
      name: 'doble-factor',
      query: { redirect: '/finanzas' },
    });
    expect(
      await guardaDeSesion(
        ruta('/seguridad/doble-factor', { sinCondominio: true }, 'doble-factor'),
        pendiente,
      ),
    ).toBe(true);
    // Puede elegir otro condominio donde no esté pendiente
    expect(
      await guardaDeSesion(
        ruta('/condominios', { sinCondominio: true }, 'seleccionar-condominio'),
        pendiente,
      ),
    ).toBe(true);
  });

  it('con la verificación activa (o sin exigirla) las rutas abren normal', async () => {
    expect(await guardaDeSesion(ruta('/finanzas', {}, 'finanzas-resumen'), sesion())).toBe(true);
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
  it('en desarrollo el administrador la abre aunque el permiso aún no exista', async () => {
    const destino = await guardaDeSesion(
      ruta('/finanzas', { vistaPrevia: true }, 'finanzas-resumen'),
      sesion({ tienePermiso: () => false }),
      { vistasPrevias: true },
    );
    expect(destino).toBe(true);
  });

  it('un residente no abre las vistas previas de la administración', async () => {
    const destino = await guardaDeSesion(
      ruta('/finanzas', { vistaPrevia: true }, 'finanzas-resumen'),
      sesion({ roles: ['residente'], tienePermiso: () => false }),
      { vistasPrevias: true },
    );
    expect(destino).toEqual({ name: 'sin-permiso' });
  });

  it('otro perfil la abre si tiene el permiso de su ítem de menú', async () => {
    const destino = await guardaDeSesion(
      ruta('/unidades', { vistaPrevia: true }, 'unidades'),
      sesion({ roles: ['presidente'], tienePermiso: (p) => p === 'unidades.ver' }),
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
