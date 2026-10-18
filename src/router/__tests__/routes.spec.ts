import { createRouterMatcher } from 'vue-router';
import { describe, expect, it } from 'vitest';

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
