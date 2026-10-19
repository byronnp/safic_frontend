import { describe, expect, it } from 'vitest';

import { appDelPerfil, appsDisponibles, opcionesDeCuentaApp } from '../apps';

const RESIDENTE = ['cuenta.propia', 'reservas.propias', 'visitas.propias', 'avisos.propios'];
// El guardia trae por defecto incidencias.reportar, que también es del residente
const GUARDIA = [
  'unidades.ver',
  'garita.registrar',
  'garita.directorio',
  'paquetes.gestionar',
  'incidencias.reportar',
];

describe('apps del perfil', () => {
  it('ofrece solo las apps que los permisos permiten', () => {
    expect(appsDisponibles(RESIDENTE).map((a) => a.clave)).toEqual(['residente']);
    expect(appsDisponibles(GUARDIA).map((a) => a.clave)).toEqual(['guardia']);
    expect(appsDisponibles([...RESIDENTE, ...GUARDIA]).map((a) => a.clave)).toEqual([
      'residente',
      'guardia',
    ]);
    expect(appsDisponibles(['finanzas.ver'])).toEqual([]);
  });

  it('al guardia no se le ofrece la app del residente solo por compartir el permiso de incidencias', () => {
    expect(appsDisponibles(GUARDIA).map((a) => a.clave)).toEqual(['guardia']);
    expect(opcionesDeCuentaApp(GUARDIA, 1, 'guardia').otrasApps).toEqual([]);
    // Un rol nuevo que solo reporta incidencias sí es de residente
    expect(appsDisponibles(['incidencias.reportar']).map((a) => a.clave)).toEqual(['residente']);
  });

  it('el residente solo tiene cerrar sesión; sin administración ni otra app', () => {
    expect(opcionesDeCuentaApp(RESIDENTE, 1, 'residente')).toEqual({
      cambiarCondominio: false,
      administracion: false,
      otrasApps: [],
    });
  });

  it('con varios condominios puede cambiar de condominio', () => {
    expect(opcionesDeCuentaApp(RESIDENTE, 2, 'residente').cambiarCondominio).toBe(true);
  });

  it('quien tiene administración y app (o un rol mixto) puede ir a la administración y a la otra app', () => {
    const mixto = [...RESIDENTE, ...GUARDIA, 'finanzas.ver'];

    expect(opcionesDeCuentaApp(mixto, 1, 'residente')).toMatchObject({
      administracion: true,
      otrasApps: [{ clave: 'guardia', ruta: 'app-guardia' }],
    });
    expect(opcionesDeCuentaApp(mixto, 1, 'guardia').otrasApps).toMatchObject([
      { clave: 'residente', ruta: 'app-residente' },
    ]);
  });

  it('un perfil sin permisos no ofrece administración', () => {
    expect(opcionesDeCuentaApp([], 1, 'residente').administracion).toBe(false);
  });

  it('appDelPerfil sigue clasificando por permisos', () => {
    expect(appDelPerfil(RESIDENTE)).toBe('app-residente');
    expect(appDelPerfil(GUARDIA)).toBe('app-guardia');
  });
});
