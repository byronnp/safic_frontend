import { createPinia, setActivePinia } from 'pinia';
import { createRouterMatcher } from 'vue-router';
import { describe, expect, it } from 'vitest';

import { useSessionStore } from '@/stores/session';

import routes from '../routes';

const ACTUAL = { path: '/', name: undefined, params: {}, matched: [], meta: {} };

describe('rutas', () => {
  it('una carga completa de «/» no se queda en el layout de login: redirige a inicio', () => {
    const resuelta = createRouterMatcher(routes, {}).resolve({ path: '/' }, ACTUAL);
    const redireccion = resuelta.matched.at(-1)?.redirect;

    expect(redireccion).toEqual({ name: 'inicio' });
  });

  it('inicio existe y se resuelve en «/»', () => {
    const resuelta = createRouterMatcher(routes, {}).resolve({ name: 'inicio' }, ACTUAL);

    expect(resuelta.path).toBe('/');
  });
});

describe('entrada de las apps', () => {
  /** A dónde manda «/app» o «/guardia» con esos permisos: la redirección lee la sesión activa. */
  function entrada(ruta: string, permisos: string[]): unknown {
    setActivePinia(createPinia());
    useSessionStore().permisos = permisos;
    const registro = createRouterMatcher(routes, {}).resolve({ path: ruta }, ACTUAL).matched.at(-1);
    const redireccion = registro?.redirect;
    return typeof redireccion === 'function' ? redireccion({} as never, {} as never) : redireccion;
  }

  it('la entrada de la app del residente y del guardia sale de los permisos de la sesión', () => {
    // «Mi hogar» es vista previa y no cuenta como entrada (la regla está en menu.spec)
    expect(entrada('/app', ['cuenta.propia'])).toEqual({ name: 'app-mi-cuenta' });
    expect(entrada('/guardia', ['garita.directorio'])).toEqual({ name: 'guardia-directorio' });
    expect(entrada('/guardia', [])).toEqual({ name: 'sin-permiso' });
  });
});
