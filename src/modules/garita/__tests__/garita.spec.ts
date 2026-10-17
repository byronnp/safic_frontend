import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesGarita } from '../composables/useGarita';
import {
  detalleDentro,
  detalleEsperada,
  diaDe,
  filtrosPorRango,
  horaDe,
  peticionSinQr,
  sinQrVacio,
  validarSinQr,
} from '../garita.logica';
import { garitaService } from '../services/garita.service';

afterEach(() => vi.restoreAllMocks());

describe('garita', () => {
  it('las claves de caché incluyen el condominio', () => {
    const f = filtrosPorRango('hoy', '2026-10-17', null, '');
    expect(clavesGarita.panel(3)).toEqual(['garita', 3, 'panel']);
    expect(clavesGarita.bitacora(3, f)).not.toEqual(clavesGarita.bitacora(4, f));
  });

  it('describe a quien está dentro y a quien se espera', () => {
    expect(
      detalleDentro({
        id: 1,
        nombre: 'Carlos Vega',
        tipo: 'visita',
        unidad: 'A-201',
        destino: null,
        placa: null,
        desde: '13:40',
      }),
    ).toBe('A-201 · visita · desde 13:40');
    expect(
      detalleDentro({
        id: 2,
        nombre: 'Técnicos',
        tipo: 'proveedor',
        unidad: null,
        destino: 'Torre B',
        placa: 'PDQ-1',
        desde: '08:52',
      }),
    ).toBe('Torre B · proveedor · PDQ-1 · desde 08:52');
    expect(
      detalleEsperada({
        id: 3,
        nombre: 'Juan',
        unidad: 'A-102',
        placa: 'PDQ-3321',
        hora_desde: '15:00',
        hora_hasta: '20:00',
      }),
    ).toBe('A-102 · 15:00–20:00 · PDQ-3321');
    expect(
      detalleEsperada({
        id: 3,
        nombre: 'Juan',
        unidad: 'A-102',
        placa: null,
        hora_desde: '15:00',
        hora_hasta: '20:00',
      }),
    ).toBe('A-102 · 15:00–20:00');
  });

  it('un ingreso sin QR pide nombre y, según el tipo, unidad o lugar', () => {
    const base = { ...sinQrVacio(), nombre: 'Carlos Andrade', unidad: 'A-102' };
    expect(validarSinQr(base)).toEqual({});
    expect(validarSinQr({ ...base, nombre: 'Ab' }).nombre).toBeDefined();
    expect(validarSinQr({ ...base, unidad: '' }).unidad).toBeDefined();
    expect(validarSinQr({ ...base, cedula: '12 34' }).cedula).toBeDefined();
    expect(validarSinQr({ ...base, placa: 'ZZZ' }).placa).toBeDefined();
    // Proveedor: basta el lugar; sin unidad ni lugar, falta
    const prov = { ...base, tipo: 'proveedor' as const, unidad: '' };
    expect(validarSinQr({ ...prov, destino: 'Torre B' })).toEqual({});
    expect(validarSinQr(prov).destino).toBeDefined();
  });

  it('arma la petición con vacíos como null y la placa en mayúsculas', () => {
    expect(
      peticionSinQr({ ...sinQrVacio(), nombre: ' Carlos ', unidad: ' A-102 ', placa: 'abc-1234' }),
    ).toEqual({
      tipo: 'visita',
      nombre: 'Carlos',
      documento: null,
      placa: 'ABC-1234',
      unidad_codigo: 'A-102',
      destino: null,
      autorizado_por: 'llamada',
    });
  });

  it('formatea horas y días de la bitácora', () => {
    expect(horaDe('2026-10-17T09:41:00-05:00')).toBe('09:41');
    expect(horaDe(null)).toBe('—');
    expect(diaDe('2026-10-17T09:41:00-05:00', '2026-10-17')).toBe('Hoy');
    expect(diaDe('2026-10-16T22:15:00-05:00', '2026-10-17')).toBe('Ayer');
    expect(diaDe('2026-10-12T10:00:00-05:00', '2026-10-17')).toBe('12 oct');
    expect(filtrosPorRango('7dias', '2026-10-17', 'proveedor', ' luis ')).toEqual({
      desde: '2026-10-11',
      hasta: '2026-10-17',
      tipo: 'proveedor',
      q: ' luis ',
    });
  });

  it('el servicio usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });

    await garitaService.panel();
    expect(get).toHaveBeenCalledWith('/garita/panel');
    await garitaService.validarQr('7-abc');
    expect(post).toHaveBeenCalledWith('/garita/qr/validar', { token: '7-abc' });
    await garitaService.ingresoConQr('7-abc');
    expect(post).toHaveBeenCalledWith('/garita/accesos', { token: '7-abc' });
    await garitaService.salida(9);
    expect(post).toHaveBeenCalledWith('/garita/accesos/9/salida');
    await garitaService.bitacora({ desde: '2026-10-11', hasta: '2026-10-17', tipo: null, q: '  ' });
    expect(get).toHaveBeenCalledWith('/garita/bitacora', {
      params: { desde: '2026-10-11', hasta: '2026-10-17' },
    });
    await garitaService.bitacora({
      desde: '2026-10-17',
      hasta: '2026-10-17',
      tipo: 'delivery',
      q: 'rappi',
    });
    expect(get).toHaveBeenCalledWith('/garita/bitacora', {
      params: { desde: '2026-10-17', hasta: '2026-10-17', tipo: 'delivery', q: 'rappi' },
    });
  });
});
