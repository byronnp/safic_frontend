import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesReglasFinanzas } from '../composables/useReglasFinanzas';
import {
  cambiosDeReglas,
  formularioDeReglas,
  montoNormalizado,
  validarReglas,
} from '../reglas-finanzas.logica';
import { reglasFinanzasService, type ReglasFinanzas } from '../services/reglas-finanzas.service';

afterEach(() => vi.restoreAllMocks());

const reglas: ReglasFinanzas = {
  umbral_segunda_aprobacion: '500.00',
  aprobador_puede_pagar: false,
  tolerancia_bancaria: '0.50',
};

describe('reglas de dinero', () => {
  it('la clave de caché incluye el condominio', () => {
    expect(clavesReglasFinanzas.todas(7)).toEqual(['reglas-finanzas', 7]);
    expect(clavesReglasFinanzas.todas(8)).not.toEqual(clavesReglasFinanzas.todas(7));
  });

  it('normaliza montos con coma o punto', () => {
    expect(montoNormalizado('1.200,5')).toBe('1200.50');
    expect(montoNormalizado('0,1')).toBe('0.10');
    expect(montoNormalizado('abc')).toBe('');
    expect(montoNormalizado('1.234')).toBe('');
  });

  it('valida umbral mayor a cero y tolerancia de 0 a 5', () => {
    expect(validarReglas(formularioDeReglas(reglas))).toEqual({});
    expect(validarReglas({ ...formularioDeReglas(reglas), umbral: '0' }).umbral).toBeDefined();
    expect(
      validarReglas({ ...formularioDeReglas(reglas), tolerancia: '5,01' }).tolerancia,
    ).toBeDefined();
    expect(validarReglas({ ...formularioDeReglas(reglas), tolerancia: '0' })).toEqual({});
  });

  it('envía solo lo que cambió', () => {
    expect(cambiosDeReglas(reglas, formularioDeReglas(reglas))).toEqual({});
    expect(
      cambiosDeReglas(reglas, { umbral: '1200', aprobadorPuedePagar: true, tolerancia: '0,5' }),
    ).toEqual({ umbral_segunda_aprobacion: '1200.00', aprobador_puede_pagar: true });
  });

  it('usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: reglas } });
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { data: reglas } });
    await reglasFinanzasService.ver();
    expect(get).toHaveBeenCalledWith('/finanzas/configuracion');
    await reglasFinanzasService.guardar({ tolerancia_bancaria: '0.10' });
    expect(put).toHaveBeenCalledWith('/finanzas/configuracion', { tolerancia_bancaria: '0.10' });
  });
});
