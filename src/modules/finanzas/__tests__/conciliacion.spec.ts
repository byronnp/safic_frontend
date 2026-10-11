import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  accionDeSugerida,
  ajusteSugerido,
  esCredito,
  normalizarSaldo,
  notaDiferencia,
  textoArchivoCuadra,
  validarAjuste,
  validarImportar,
} from '../conciliacion.logica';
import { clavesConciliacion } from '../composables/useConciliacion';
import {
  conciliacionService,
  type Cuadre,
  type LineaBanco,
} from '../services/conciliacion.service';

afterEach(() => vi.restoreAllMocks());

const cuadre = (c: Partial<Cuadre>): Cuadre => ({
  saldo_inicial: '1000.00',
  pagos_residentes: '0.00',
  intereses: '0.00',
  gastos_pagados: '0.00',
  comisiones: '0.00',
  otros: '0.00',
  ajustes: '0.00',
  saldo_app: '1000.00',
  saldo_banco: '988.00',
  diferencia: '-12.00',
  archivo_cuadra: true,
  ...c,
});

const linea = (l: Partial<LineaBanco>): LineaBanco =>
  ({ id: 1, monto: '80.00', propuesta: null, ...l }) as LineaBanco;

describe('conciliación', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesConciliacion.estados(7, '2026-09')).toEqual([
      'finanzas',
      7,
      'conciliacion',
      'estados',
      '2026-09',
    ]);
    expect(clavesConciliacion.detalle(7, 3)).toEqual(['finanzas', 7, 'conciliacion', 'detalle', 3]);
    expect(clavesConciliacion.detalle(8, 3)).not.toEqual(clavesConciliacion.detalle(7, 3));
  });

  it('decide la acción de una sugerencia según su tipo', () => {
    expect(
      accionDeSugerida(linea({ propuesta: { tipo: 'pago_residente', id: 5, texto: null } }))?.tipo,
    ).toBe('vincular');
    expect(
      accionDeSugerida(linea({ propuesta: { tipo: 'comision', id: null, texto: null } }))?.tipo,
    ).toBe('clasificar');
    expect(
      accionDeSugerida(linea({ propuesta: { tipo: 'pago_residente', id: null, texto: null } })),
    ).toBeNull();
    expect(accionDeSugerida(linea({}))).toBeNull();
    expect(esCredito(linea({ monto: '-0.41' }))).toBe(false);
  });

  it('avisa si cuadra, si falta o si no hay saldos; y propone el ajuste exacto', () => {
    expect(notaDiferencia(cuadre({ diferencia: '0.00' })).tono).toBe('exito');
    expect(notaDiferencia(cuadre({})).tono).toBe('error');
    expect(notaDiferencia(cuadre({ diferencia: null })).tono).toBe('info');
    expect(ajusteSugerido(cuadre({ diferencia: '-12.00' }))).toBe('-12.00');
    expect(ajusteSugerido(cuadre({ diferencia: null }))).toBe('');
    expect(textoArchivoCuadra(cuadre({ archivo_cuadra: false }))).toMatch(/no cuadra/);
    expect(textoArchivoCuadra(cuadre({ archivo_cuadra: null }))).toBe('Sin saldos en el archivo');
  });

  it('valida el archivo a importar y los saldos', () => {
    const f = { cuentaBancariaId: 1, periodo: '2026-09', saldoInicial: '', saldoFinal: '' };
    const xlsx = new File(['x'], 'estado.xlsx');
    expect(validarImportar(f, xlsx)).toEqual({});
    expect(validarImportar({ ...f, cuentaBancariaId: null }, null)).toMatchObject({
      cuentaBancariaId: expect.any(String),
      archivo: expect.any(String),
    });
    expect(validarImportar(f, new File(['x'], 'foto.png')).archivo).toMatch(/Excel/);
    expect(validarImportar({ ...f, saldoFinal: 'abc' }, xlsx).saldoFinal).toBeDefined();
    expect(normalizarSaldo('1.234,5')).toBe('1234.50');
    expect(normalizarSaldo('-12,5')).toBe('-12.50');
  });

  it('valida el ajuste: monto distinto de cero y motivo', () => {
    expect(validarAjuste('-12,00', 'Cobro no identificado')).toEqual({});
    expect(validarAjuste('0', 'x').monto).toBe('El ajuste no puede ser cero.');
    expect(validarAjuste('abc', 'Motivo válido').monto).toBeDefined();
    expect(validarAjuste('5', 'no').motivo).toBeDefined();
  });

  it('usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { data: {}, meta: { nuevos: 3, duplicados: 0, fuera_del_mes: 0 } },
    });
    await conciliacionService.estados('2026-09');
    expect(get).toHaveBeenCalledWith('/conciliacion/estados', { params: { periodo: '2026-09' } });
    await conciliacionService.vincular(4, 'pago_residente', 9);
    expect(post).toHaveBeenLastCalledWith('/conciliacion/movimientos/4/vincular', {
      tipo: 'pago_residente',
      pago_id: 9,
    });
    await conciliacionService.clasificar(4, 'comision', true);
    expect(post).toHaveBeenLastCalledWith('/conciliacion/movimientos/4/clasificar', {
      tipo: 'comision',
      guardar_regla: true,
    });
    await conciliacionService.deshacer(4);
    expect(post).toHaveBeenLastCalledWith('/conciliacion/movimientos/4/deshacer');
    await conciliacionService.ajustar(2, '-12.00', 'Motivo');
    expect(post).toHaveBeenLastCalledWith('/conciliacion/estados/2/ajustes', {
      monto: '-12.00',
      motivo: 'Motivo',
    });

    const r = await conciliacionService.importar({
      cuentaBancariaId: 1,
      periodo: '2026-09',
      archivo: new File(['x'], 'e.csv'),
      saldoInicial: '100.00',
      saldoFinal: null,
    });
    const f = post.mock.calls.at(-1)?.[1] as FormData;
    expect(post.mock.calls.at(-1)?.[0]).toBe('/conciliacion/estados');
    expect(f.get('saldo_inicial')).toBe('100.00');
    expect(f.has('saldo_final')).toBe(false);
    expect(r.nuevos).toBe(3);
  });
});
