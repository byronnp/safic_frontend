import { describe, expect, it } from 'vitest';

import { cedulaValida, rucValido } from '../identificacion';

describe('cédula', () => {
  it.each([
    ['1710034065', true],
    ['1712345675', true],
    ['0912345675', true],
    ['1712345678', false],
    ['2512345678', false],
    ['1762345678', false],
    ['171234567', false],
  ])('%s → %s', (cedula, esperado) => {
    expect(cedulaValida(cedula)).toBe(esperado);
  });
});

describe('RUC', () => {
  it.each([
    ['1710034065001', true],
    ['1792456781001', true],
    ['1760001550001', true],
    ['1710034065000', false],
    ['1712345678001', false],
    ['1772456781001', false],
  ])('%s → %s', (ruc, esperado) => {
    expect(rucValido(ruc)).toBe(esperado);
  });
});
