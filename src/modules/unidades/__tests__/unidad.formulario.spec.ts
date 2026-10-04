import { describe, expect, it } from 'vitest';

import {
  cuentaParaCupo,
  formularioVacio,
  normalizarDecimal,
  validarUnidad,
  type FormularioUnidad,
} from '../unidad.formulario';

function formulario(cambios: Partial<FormularioUnidad> = {}): FormularioUnidad {
  return { ...formularioVacio(), codigo: 'a-104', area: '84', piso: '1', ...cambios };
}

describe('normalizarDecimal', () => {
  it('acepta coma o punto decimal y completa los decimales', () => {
    expect(normalizarDecimal('84', 2)).toBe('84.00');
    expect(normalizarDecimal('84,5', 2)).toBe('84.50');
    expect(normalizarDecimal('1.234,50', 2)).toBe('1234.50');
    expect(normalizarDecimal('0,62', 4)).toBe('0.6200');
  });

  it('rechaza cero, negativos y demasiados decimales', () => {
    expect(normalizarDecimal('0', 2)).toBeNull();
    expect(normalizarDecimal('-3', 2)).toBeNull();
    expect(normalizarDecimal('84,555', 2)).toBeNull();
    expect(normalizarDecimal('', 2)).toBeNull();
  });
});

describe('validarUnidad', () => {
  it('con valor general arma el cuerpo sin montos', () => {
    const r = validarUnidad(formulario(), 'general');

    expect(r).toEqual({
      ok: true,
      datos: {
        codigo: 'A-104',
        bloque_id: null,
        tipo: 'departamento',
        piso: 1,
        area_m2: '84.00',
        responsable_pago: 'propietario',
        alicuota: null,
      },
    });
  });

  it('exige código y área', () => {
    const r = validarUnidad(formulario({ codigo: ' ', area: '' }), 'general');

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errores.codigo).toBe('Escribe el código de la unidad.');
      expect(r.errores.area).toContain('área');
    }
  });

  it('por alícuota exige la alícuota y no deja pasar de 100 %', () => {
    expect(validarUnidad(formulario(), 'alicuota').ok).toBe(false);

    const exceso = validarUnidad(formulario({ alicuota: '100,5' }), 'alicuota');
    expect(exceso.ok || exceso.errores.alicuota).toBe('La alícuota no puede pasar de 100 %.');

    const r = validarUnidad(
      formulario({ alicuota: '0,62', valorPersonalizado: '75,5' }),
      'alicuota',
    );
    expect(r.ok && r.datos).toMatchObject({ alicuota: '0.6200', valor_personalizado: '75.50' });
  });

  it('por unidad exige la cuota mensual', () => {
    const sinCuota = validarUnidad(formulario(), 'unidad');
    expect(sinCuota.ok || sinCuota.errores.cuotaMensual).toContain('monto');

    const r = validarUnidad(formulario({ cuotaMensual: '90' }), 'unidad');
    expect(r.ok && r.datos.cuota_mensual).toBe('90.00');
  });

  it('el piso es opcional y entero', () => {
    expect(validarUnidad(formulario({ piso: '' }), 'general')).toMatchObject({
      ok: true,
      datos: { piso: null },
    });
    expect(validarUnidad(formulario({ piso: '1,5' }), 'general').ok).toBe(false);
  });
});

it('solo departamentos, casas y locales cuentan para el cupo', () => {
  expect(cuentaParaCupo('local')).toBe(true);
  expect(cuentaParaCupo('parqueadero')).toBe(false);
  expect(cuentaParaCupo('bodega')).toBe(false);
});
