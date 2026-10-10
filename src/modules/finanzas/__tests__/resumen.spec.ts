import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesFinanzas } from '../composables/usePeriodos';
import {
  aCentavos,
  estadoDelResumen,
  mesEnFrase,
  nombreMes,
  opcionesDeMes,
  porcentaje,
  tramosConBarra,
} from '../resumen.logica';
import { periodosService, type ResumenFinanciero } from '../services/periodos.service';

afterEach(() => vi.restoreAllMocks());

describe('claves de caché', () => {
  it('incluyen el condominio', () => {
    expect(clavesFinanzas.resumen(7, '2026-09')).toEqual(['finanzas', 7, 'resumen', '2026-09']);
    expect(clavesFinanzas.resumen(7, null)).toEqual(['finanzas', 7, 'resumen', 'en-curso']);
    expect(clavesFinanzas.resumen(8, null)).not.toEqual(clavesFinanzas.resumen(7, null));
    expect(clavesFinanzas.periodos(7).slice(0, 2)).toEqual(['finanzas', 7]);
  });
});

describe('periodosService', () => {
  it('pide el resumen del mes en curso sin parámetros y el de un mes con parámetro', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    await periodosService.resumen();
    await periodosService.resumen('2026-09');
    expect(get).toHaveBeenNthCalledWith(1, '/finanzas/resumen', {});
    expect(get).toHaveBeenNthCalledWith(2, '/finanzas/resumen', { params: { periodo: '2026-09' } });
  });

  it('lista y emite', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { creadas: 3 } } });
    await expect(periodosService.listar()).resolves.toEqual([]);
    await expect(periodosService.emitir('2026-09')).resolves.toEqual({ creadas: 3 });
    expect(get).toHaveBeenCalledWith('/finanzas/periodos');
    expect(post).toHaveBeenCalledWith('/finanzas/periodos', { periodo: '2026-09' });
  });
});

describe('dinero en centavos', () => {
  it('convierte texto decimal sin pasar por float', () => {
    expect(aCentavos('12320.50')).toBe(1232050);
    expect(aCentavos('0.1')).toBe(10);
    expect(aCentavos('80')).toBe(8000);
    expect(aCentavos('-5.25')).toBe(-525);
  });

  it('el porcentaje es entero, tope 100 y 0 sin total', () => {
    expect(porcentaje('9856.00', '12320.00')).toBe(80);
    expect(porcentaje('20.00', '10.00')).toBe(100);
    expect(porcentaje('5.00', '0.00')).toBe(0);
    expect(porcentaje('99.60', '100.00')).toBe(99);
  });
});

describe('nombres de mes', () => {
  it('formatea el periodo', () => {
    expect(nombreMes('2026-09')).toBe('Septiembre 2026');
    expect(mesEnFrase('2026-01')).toBe('enero');
  });
});

describe('opcionesDeMes', () => {
  it('une los emitidos con el que se ve, del más reciente al más antiguo y sin repetir', () => {
    const emitidos = [
      { periodo: '2026-08', estado: 'cerrado', esperado: '1.00', recaudado: '1.00' },
      { periodo: '2026-09', estado: 'abierto', esperado: '1.00', recaudado: '0.00' },
    ] as const;
    expect(opcionesDeMes(emitidos, '2026-10').map((o) => o.valor)).toEqual([
      '2026-10',
      '2026-09',
      '2026-08',
    ]);
    expect(opcionesDeMes(emitidos, '2026-09')).toHaveLength(2);
    expect(opcionesDeMes(emitidos, '')).toHaveLength(2);
  });
});

describe('tramosConBarra', () => {
  it('la barra de cada tramo es relativa al mayor', () => {
    const t = tramosConBarra([
      { tramo: 'al_dia', etiqueta: 'Al día', saldo: '9856.00', unidades: 117 },
      { tramo: 'd1_30', etiqueta: '1–30 días', saldo: '1840.00', unidades: 19 },
      { tramo: 'd90_mas', etiqueta: 'Más de 90', saldo: '0.00', unidades: 0 },
    ]);
    expect(t.map((x) => x.ancho)).toEqual([100, 19, 0]);
    expect(t[0]!.color).toBe('#0E5E5B');
  });

  it('sin saldos todas las barras quedan en cero', () => {
    expect(
      tramosConBarra([{ tramo: 'al_dia', etiqueta: 'Al día', saldo: '0.00', unidades: 0 }])[0]!
        .ancho,
    ).toBe(0);
  });
});

describe('estadoDelResumen', () => {
  it('un mes sin emitir no tiene estado de periodo', () => {
    const base = { estado: null } as unknown as ResumenFinanciero;
    expect(estadoDelResumen(base)).toBe('sin_emitir');
    expect(estadoDelResumen({ ...base, estado: 'cerrado' })).toBe('cerrado');
  });
});
