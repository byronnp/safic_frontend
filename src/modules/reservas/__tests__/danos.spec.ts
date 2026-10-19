import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  aSolicitud,
  danosVacio,
  normalizarMonto,
  textoDecision,
  textoPorDevolver,
  validarDanos,
} from '../danos.logica';
import { clavesDanos } from '../composables/useDanos';
import { danosService } from '../services/danos.service';

afterEach(() => vi.restoreAllMocks());

describe('daños de una reserva', () => {
  it('normaliza el monto a dos decimales y rechaza lo que no es dinero', () => {
    expect(normalizarMonto('12,5')).toBe('12.50');
    expect(normalizarMonto(' 80 ')).toBe('80.00');
    expect(normalizarMonto('0.05')).toBe('0.05');
    for (const malo of ['', 'abc', '12.345', '-5', '1e3', '123456']) {
      expect(normalizarMonto(malo)).toBeNull();
    }
  });

  it('exige elegir una decisión; «sin cargo» no pide monto', () => {
    expect(validarDanos(danosVacio(), '50.00').decision).toBeDefined();
    expect(validarDanos({ decision: 'sin_cargo', monto: '', nota: '' }, '50.00')).toEqual({});
  });

  it('descontar o cobrar piden un monto válido; descontar no pasa de la garantía', () => {
    const f = (decision: 'descontar_garantia' | 'cobrar_cuenta', monto: string) => ({
      decision,
      monto,
      nota: '',
    });

    expect(validarDanos(f('cobrar_cuenta', ''), '50.00').monto).toBeDefined();
    expect(validarDanos(f('cobrar_cuenta', '0'), '50.00').monto).toMatch(/mayor que cero/);
    expect(validarDanos(f('cobrar_cuenta', '500'), '50.00')).toEqual({});
    expect(validarDanos(f('descontar_garantia', '50'), '50.00')).toEqual({});
    expect(validarDanos(f('descontar_garantia', '50.01'), '50.00').monto).toMatch(/garantía/);
  });

  it('valida el largo de la nota', () => {
    expect(
      validarDanos({ decision: 'sin_cargo', monto: '', nota: 'x'.repeat(301) }, '0.00').nota,
    ).toBeDefined();
  });

  it('arma la solicitud sin monto para «sin cargo» y con monto normalizado y nota recortada', () => {
    expect(aSolicitud({ decision: 'sin_cargo', monto: '99', nota: '  ' })).toEqual({
      decision: 'sin_cargo',
    });
    expect(aSolicitud({ decision: 'cobrar_cuenta', monto: '35,5', nota: ' Silla rota ' })).toEqual({
      decision: 'cobrar_cuenta',
      monto: '35.50',
      nota: 'Silla rota',
    });
  });

  it('dice lo que queda por devolver, o nada', () => {
    expect(textoPorDevolver('29.50')).toContain('29,50');
    expect(textoPorDevolver('0.00')).toBeNull();
    expect(textoPorDevolver(null)).toBeNull();
    expect(textoDecision('cobrar_cuenta')).toBe('Cobrar a la cuenta de la unidad');
  });

  it('las claves de caché llevan el condominio', () => {
    expect(clavesDanos.lista(7)).toEqual(['reservas', 7, 'danos']);
    expect(clavesDanos.detalle(7, 3)).toEqual(['reservas', 7, 'danos', 3]);
  });

  it('el servicio usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });

    await danosService.lista();
    await danosService.detalle(5);
    await danosService.resolver(5, { decision: 'sin_cargo' });

    expect(get).toHaveBeenCalledWith('/areas-comunes/danos');
    expect(get).toHaveBeenCalledWith('/areas-comunes/reservas/5/danos');
    expect(post).toHaveBeenCalledWith('/areas-comunes/reservas/5/danos/resolver', {
      decision: 'sin_cargo',
    });
  });
});
