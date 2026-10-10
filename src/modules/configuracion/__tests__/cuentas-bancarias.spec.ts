import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesCuentasBancarias } from '../composables/useCuentasBancarias';
import {
  cambiosDe,
  FORMULARIO_CUENTA_VACIO,
  formularioDesde,
  numeroEnmascarado,
  peticionNueva,
  validarCuenta,
} from '../cuentas-bancarias.logica';
import {
  cuentasBancariasService,
  type CuentaBancaria,
} from '../services/cuentas-bancarias.service';

afterEach(() => vi.restoreAllMocks());

const cuenta: CuentaBancaria = {
  id: 1,
  banco: 'Banco Pichincha',
  tipo: 'corriente',
  numero: '2100123456',
  titular: 'Condominio Jardines del Valle',
  es_principal: true,
  activa: true,
};

describe('cuentas bancarias', () => {
  it('la clave de caché incluye el condominio', () => {
    expect(clavesCuentasBancarias.todas(4)).toEqual(['cuentas-bancarias', 4]);
  });

  it('valida banco, número y titular', () => {
    expect(validarCuenta({ ...FORMULARIO_CUENTA_VACIO })).toMatchObject({
      banco: 'El banco tiene mínimo 2 caracteres.',
      numero: 'El número de cuenta lleva de 5 a 30 letras, números o guiones.',
      titular: 'El titular tiene mínimo 3 caracteres.',
    });
    expect(validarCuenta({ ...formularioDesde(cuenta) })).toEqual({});
    expect(validarCuenta({ ...formularioDesde(cuenta), numero: '12 34' }).numero).toBeDefined();
  });

  it('arma la petición de una cuenta nueva, con espacios recortados', () => {
    expect(
      peticionNueva({
        banco: ' Produbanco ',
        tipo: 'ahorros',
        numero: ' 7730-123 ',
        titular: ' Condominio JV ',
        esPrincipal: true,
      }),
    ).toEqual({
      banco: 'Produbanco',
      tipo: 'ahorros',
      numero: '7730-123',
      titular: 'Condominio JV',
      es_principal: true,
    });
    expect(peticionNueva({ ...formularioDesde(cuenta), esPrincipal: false })).not.toHaveProperty(
      'es_principal',
    );
  });

  it('al editar solo manda lo que cambió y no pide quitar la principal', () => {
    expect(cambiosDe(cuenta, formularioDesde(cuenta))).toEqual({});
    expect(cambiosDe(cuenta, { ...formularioDesde(cuenta), titular: 'Otro' })).toEqual({
      titular: 'Otro',
    });
    expect(cambiosDe(cuenta, { ...formularioDesde(cuenta), esPrincipal: false })).toEqual({});
    expect(
      cambiosDe(
        { ...cuenta, es_principal: false },
        { ...formularioDesde(cuenta), esPrincipal: true },
      ),
    ).toEqual({ es_principal: true });
  });

  it('enmascara el número en la lista', () => {
    expect(numeroEnmascarado('2100123456')).toBe('•••• 3456');
  });

  it('el servicio usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: cuenta } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: cuenta } });

    await cuentasBancariasService.listar();
    await cuentasBancariasService.crear({
      banco: 'X',
      tipo: 'ahorros',
      numero: '12345',
      titular: 'Y',
    });
    await cuentasBancariasService.editar(3, { activa: false });

    expect(get).toHaveBeenCalledWith('/cuentas-bancarias');
    expect(post).toHaveBeenCalledWith('/cuentas-bancarias', expect.any(Object));
    expect(patch).toHaveBeenCalledWith('/cuentas-bancarias/3', { activa: false });
  });
});
