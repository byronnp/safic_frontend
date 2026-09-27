import { describe, expect, it } from 'vitest';

import { etiquetaRol } from '../roles';

describe('etiqueta de rol', () => {
  it('muestra el rol más relevante', () => {
    expect(etiquetaRol(['residente', 'presidente'])).toBe('Presidencia');
    expect(etiquetaRol(['administrador'])).toBe('Administración');
    expect(etiquetaRol([])).toBe('');
  });
});
