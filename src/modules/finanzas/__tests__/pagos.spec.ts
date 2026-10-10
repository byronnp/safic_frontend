import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesPagos } from '../composables/usePagos';
import {
  detalleBanco,
  errorMotivo,
  montoEscrito,
  montoParaAprobar,
  textoAplicacion,
  textoCuotas,
} from '../pagos.logica';
import { pagosService } from '../services/pagos.service';

afterEach(() => vi.restoreAllMocks());

describe('claves de caché', () => {
  it('incluyen el condominio y cuelgan de las de finanzas', () => {
    expect(clavesPagos.lista(7, 'pendiente')).toEqual(['finanzas', 7, 'pagos', 'pendiente']);
    expect(clavesPagos.detalle(7, 3)).toEqual(['finanzas', 7, 'pago', 3]);
    expect(clavesPagos.lista(8, 'pendiente')).not.toEqual(clavesPagos.lista(7, 'pendiente'));
  });
});

describe('textos de la lista', () => {
  it('resume las cuotas de un pago', () => {
    expect(textoCuotas({ cuotas: [] })).toBe('—');
    expect(textoCuotas({ cuotas: ['2026-09'] })).toBe('Septiembre');
    expect(textoCuotas({ cuotas: ['2026-08', '2026-09'] })).toBe('2 cuotas');
  });

  it('muestra el banco y la fecha corta', () => {
    expect(detalleBanco({ banco: 'Banco Pichincha', fecha: '2026-09-27' })).toBe(
      'Banco Pichincha · 27 sept',
    );
    expect(detalleBanco({ banco: null, fecha: '2026-09-27' })).toBe('Banco · 27 sept');
  });
});

describe('qué pasaría al aprobar', () => {
  const base = { ajuste: '0.00', credito_previo: '0.00' };

  it('dice a cuántas cuotas y cuánto queda a favor', () => {
    expect(textoAplicacion({ ...base, cuotas_completas: 1, a_saldo_favor: '20.00' })).toBe(
      'Aplicar a 1 cuota completa y $ 20,00 a saldo a favor',
    );
    expect(textoAplicacion({ ...base, cuotas_completas: 2, a_saldo_favor: '0.00' })).toBe(
      'Aplicar a 2 cuotas completas',
    );
  });

  it('avisa cuando no alcanza para ninguna cuota', () => {
    expect(textoAplicacion({ ...base, cuotas_completas: 0, a_saldo_favor: '50.00' })).toBe(
      'El monto no completa ninguna cuota: $ 50,00 quedan a saldo a favor',
    );
    expect(textoAplicacion({ ...base, cuotas_completas: 0, a_saldo_favor: '0.00' })).toBe(
      'No se aplica a ninguna cuota',
    );
  });
});

describe('monto recibido', () => {
  it('acepta coma o punto y hasta dos decimales', () => {
    expect(montoEscrito('79,60')).toBe('79.60');
    expect(montoEscrito(' 80 ')).toBe('80.00');
    expect(montoEscrito('0.5')).toBe('0.50');
    expect(montoEscrito('')).toBeNull();
    expect(montoEscrito('0')).toBeNull();
    expect(montoEscrito('80.123')).toBeNull();
    expect(montoEscrito('-5')).toBeNull();
    expect(montoEscrito('abc')).toBeNull();
  });

  it('solo se manda si la persona cambió lo declarado', () => {
    expect(montoParaAprobar('80.00', '80')).toBeUndefined();
    expect(montoParaAprobar('80.00', '80,00')).toBeUndefined();
    expect(montoParaAprobar('80.00', '79.60')).toBe('79.60');
    expect(montoParaAprobar('80.00', 'x')).toBeNull();
  });
});

describe('motivo del rechazo', () => {
  it('pide entre 3 y 300 caracteres', () => {
    expect(errorMotivo('')).toBe('Escribe el motivo del rechazo.');
    expect(errorMotivo('ab')).toBe('El motivo es muy corto.');
    expect(errorMotivo('x'.repeat(301))).toBe('El motivo tiene máximo 300 caracteres.');
    expect(errorMotivo('Monto distinto al del banco')).toBeNull();
  });
});

describe('pagosService', () => {
  it('lista por estado y lee los conteos del meta', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: [],
        meta: { conteos: { pendiente: 2, aprobado: 1, rechazado: 0 }, tolerancia: '0.50' },
      },
    });

    const r = await pagosService.listar('pendiente');

    expect(get).toHaveBeenCalledWith('/pagos', { params: { estado: 'pendiente' } });
    expect(r.conteos).toEqual({ pendiente: 2, aprobado: 1, rechazado: 0 });
    expect(r.tolerancia).toBe('0.50');
  });

  it('aprueba con o sin monto recibido, rechaza con motivo y aprueba en lote', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { data: [], meta: { aprobados: 2, omitidos: 1 } } });

    await pagosService.aprobar(3);
    await pagosService.aprobar(3, '79.60');
    await pagosService.rechazar(3, 'No coincide');
    const lote = await pagosService.aprobarLote([1, 2, 3]);

    expect(post).toHaveBeenNthCalledWith(1, '/pagos/3/aprobar', {});
    expect(post).toHaveBeenNthCalledWith(2, '/pagos/3/aprobar', { monto_recibido: '79.60' });
    expect(post).toHaveBeenNthCalledWith(3, '/pagos/3/rechazar', { motivo: 'No coincide' });
    expect(post).toHaveBeenNthCalledWith(4, '/pagos/aprobar-lote', { ids: [1, 2, 3] });
    expect(lote).toMatchObject({ aprobados: 2, omitidos: 1 });
  });

  it('pide el recibo como archivo', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: new Blob(['%PDF-']) });
    await pagosService.recibo(9);
    expect(get).toHaveBeenCalledWith('/pagos/9/recibo', { responseType: 'blob' });
  });
});
