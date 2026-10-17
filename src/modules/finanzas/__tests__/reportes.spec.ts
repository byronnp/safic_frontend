import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesReportes } from '../composables/useReportes';
import {
  esNumerica,
  fechaExportacion,
  formatoCelda,
  nombreArchivo,
  periodoDe,
  REPORTES,
} from '../reportes.logica';
import { reportesService } from '../services/reportes.service';

afterEach(() => vi.restoreAllMocks());

describe('reportes', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesReportes.reporte(7, 'cartera_antiguedad', '2026-09')).toEqual([
      'finanzas',
      7,
      'reporte',
      'cartera_antiguedad',
      '2026-09',
    ]);
    expect(clavesReportes.exportaciones(7)).toEqual(['finanzas', 7, 'exportaciones']);
    expect(clavesReportes.exportaciones(8)).not.toEqual(clavesReportes.exportaciones(7));
  });

  it('el catálogo tiene los seis reportes del contrato, sin repetirse', () => {
    expect(REPORTES.map((r) => r.clave)).toEqual([
      'ingresos_gastos',
      'cartera_antiguedad',
      'recaudacion_mensual',
      'conciliaciones',
      'gastos_proveedor',
      'estados_cuenta',
    ]);
    expect(REPORTES.filter((r) => !r.usaPeriodo).map((r) => r.clave)).toEqual([
      'cartera_antiguedad',
      'estados_cuenta',
    ]);
  });

  it('formatea cada celda según su tipo', () => {
    expect(formatoCelda('1234.50', 'dinero')).toBe('$ 1.234,50');
    expect(formatoCelda('-200.04', 'dinero')).toBe('−$ 200,04');
    expect(formatoCelda(50, 'porcentaje')).toBe('50 %');
    expect(formatoCelda(1200, 'entero')).toMatch(/1[.\s ]?200/);
    expect(formatoCelda('A-101', 'texto')).toBe('A-101');
    expect(formatoCelda(null, 'dinero')).toBe('—');
    expect(esNumerica('dinero')).toBe(true);
    expect(esNumerica('texto')).toBe(false);
  });

  it('fecha de la exportación: hoy, ayer o el día', () => {
    const ahora = new Date('2026-10-17T20:00:00Z'); // 15:00 en Ecuador
    expect(fechaExportacion('2026-10-17T15:42:00Z', ahora)).toMatch(/^Hoy 10:42/);
    expect(fechaExportacion('2026-10-16T21:05:00Z', ahora)).toMatch(/^Ayer 16:05/);
    expect(fechaExportacion('2026-10-02T14:30:00Z', ahora)).toMatch(/^2 oct 09:30/);
    expect(nombreArchivo('cartera_antiguedad', '2026-09')).toBe('cartera-antiguedad-2026-09.xlsx');
  });

  it('los reportes «a la fecha» piden siempre el mes en curso; los demás, el elegido', () => {
    const [ingresos, cartera] = [REPORTES[0]!, REPORTES[1]!];
    expect(periodoDe(ingresos, '2026-08', '2026-10-17')).toBe('2026-08');
    expect(periodoDe(cartera, '2026-08', '2026-10-17')).toBe('2026-10');
  });

  it('usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } });
    await reportesService.ver('ingresos_gastos', '2026-09');
    expect(get).toHaveBeenCalledWith('/finanzas/reportes/ingresos_gastos', {
      params: { periodo: '2026-09' },
    });
    await reportesService.exportaciones();
    expect(get).toHaveBeenLastCalledWith('/finanzas/exportaciones');
    get.mockResolvedValue({ data: new Blob(['x']) });
    await reportesService.excel('gastos_proveedor', '2026-09');
    expect(get).toHaveBeenLastCalledWith(
      '/finanzas/reportes/gastos_proveedor/excel?periodo=2026-09',
      { responseType: 'blob' },
    );
  });
});
