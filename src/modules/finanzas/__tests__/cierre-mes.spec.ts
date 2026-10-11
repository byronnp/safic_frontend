import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  mesAnterior,
  mesPorCerrar,
  porcentajeCobrado,
  textoAvance,
  tituloCierre,
  validarMotivoReapertura,
} from '../cierre-mes.logica';
import { clavesCierre } from '../composables/useCierreMes';
import { cierreMesService, type Verificacion } from '../services/cierre-mes.service';
import type { PeriodoFinanciero } from '../services/periodos.service';

afterEach(() => vi.restoreAllMocks());

const p = (periodo: string, estado: 'abierto' | 'cerrado'): PeriodoFinanciero => ({
  periodo,
  estado,
  esperado: '0.00',
  recaudado: '0.00',
});

describe('cierre de mes', () => {
  it('la clave de caché incluye el condominio', () => {
    expect(clavesCierre.mes(7, '2026-09')).toEqual(['finanzas', 7, 'cierre', '2026-09']);
    expect(clavesCierre.mes(8, '2026-09')).not.toEqual(clavesCierre.mes(7, '2026-09'));
  });

  it('propone el mes más antiguo que terminó y sigue abierto', () => {
    const lista = [p('2026-10', 'abierto'), p('2026-08', 'cerrado'), p('2026-09', 'abierto')];
    expect(mesPorCerrar(lista, '2026-10-09')).toBe('2026-09');
    // Si todos están cerrados, el último; sin meses, el anterior al actual
    expect(mesPorCerrar([p('2026-08', 'cerrado'), p('2026-09', 'cerrado')], '2026-10-09')).toBe(
      '2026-09',
    );
    expect(mesPorCerrar([], '2026-01-15')).toBe('2025-12');
    expect(mesAnterior('2026-03')).toBe('2026-02');
  });

  it('cuenta los puntos listos y calcula el porcentaje cobrado con enteros', () => {
    const v = [
      { estado: 'listo' },
      { estado: 'revisar' },
      { estado: 'bloquea' },
      { estado: 'listo' },
    ] as Verificacion[];
    expect(textoAvance(v)).toBe('2 de 4 puntos listos');
    expect(porcentajeCobrado('11704.00', '7215.40')).toBe(61);
    expect(porcentajeCobrado('0.00', '0.00')).toBe(0);
    expect(porcentajeCobrado('100.00', '100.00')).toBe(100);
  });

  it('títulos y motivo de reapertura', () => {
    expect(tituloCierre('2026-09', false)).toBe('Cerrar septiembre 2026');
    expect(tituloCierre('2026-09', true)).toBe('Mes cerrado: septiembre 2026');
    expect(validarMotivoReapertura(' ')).toBe('Escribe el motivo de la reapertura.');
    expect(validarMotivoReapertura('no')).toBe('El motivo es muy corto.');
    expect(validarMotivoReapertura('Corregir un pago')).toBeUndefined();
  });

  it('usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    await cierreMesService.ver('2026-09');
    expect(get).toHaveBeenCalledWith('/finanzas/periodos/2026-09/cierre');
    await cierreMesService.cerrar('2026-09');
    expect(post).toHaveBeenLastCalledWith('/finanzas/periodos/2026-09/cerrar');
    await cierreMesService.reabrir('2026-09', 'Corregir un pago');
    expect(post).toHaveBeenLastCalledWith('/finanzas/periodos/2026-09/reabrir', {
      motivo: 'Corregir un pago',
    });
  });
});
