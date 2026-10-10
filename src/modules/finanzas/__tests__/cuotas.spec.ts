import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';
import { hoyEcuador, inicioDeMesAtras, sumarDias } from '@/utils/fecha';

import { clavesCuotas } from '../composables/useCuotas';
import { clavesEstadoCuenta } from '../composables/useEstadoCuenta';
import {
  formularioExtraordinariaVacio,
  normalizarMonto,
  peticionExtraordinaria,
  rangoDeCuenta,
  esSaldoAFavor,
  subtituloDelMes,
  textoResponsable,
  validarExtraordinaria,
} from '../cuotas.logica';
import { cuotasService, type ResumenCuotas } from '../services/cuotas.service';
import { estadoCuentaService } from '../services/estado-cuenta.service';

afterEach(() => vi.restoreAllMocks());

describe('claves de caché', () => {
  it('incluyen el condominio y cuelgan de las de finanzas', () => {
    const f = { filtro: 'todas', buscar: ' a ', pagina: 1 } as const;
    expect(clavesCuotas.lista(7, f)).toEqual([
      'finanzas',
      7,
      'cuotas',
      'en-curso',
      'todas',
      'a',
      1,
    ]);
    expect(clavesCuotas.lista(8, f)).not.toEqual(clavesCuotas.lista(7, f));
    expect(clavesEstadoCuenta.unidad(7, 3, { desde: '2026-08-01' })).toEqual([
      'finanzas',
      7,
      'estado-cuenta',
      3,
      '2026-08-01',
      '',
    ]);
  });
});

describe('fechas', () => {
  it('hoy en Ecuador no salta de día en la noche UTC', () => {
    expect(hoyEcuador(new Date('2026-10-10T03:00:00Z'))).toBe('2026-10-09');
  });
  it('suma días y retrocede meses', () => {
    expect(sumarDias('2026-10-25', 15)).toBe('2026-11-09');
    expect(inicioDeMesAtras('2026-10-09', 2)).toBe('2026-08-01');
    expect(inicioDeMesAtras('2026-01-09', 2)).toBe('2025-11-01');
  });
});

describe('cuota extraordinaria', () => {
  const hoy = '2026-10-09';
  const valido = { ...formularioExtraordinariaVacio(hoy), detalle: 'Bomba de agua', monto: '45,5' };

  it('vence por defecto a los 15 días', () => {
    expect(formularioExtraordinariaVacio(hoy).venceEl).toBe('2026-10-24');
  });
  it('acepta coma decimal y manda texto con dos decimales', () => {
    expect(normalizarMonto('45,5')).toBe('45.50');
    expect(validarExtraordinaria(valido, hoy)).toEqual({});
    expect(peticionExtraordinaria(valido, '2026-10')).toEqual({
      detalle: 'Bomba de agua',
      periodo: '2026-10',
      vence_el: '2026-10-24',
      modo: 'por_unidad',
      monto: '45.50',
    });
  });
  it('pide detalle, monto positivo y fecha no pasada', () => {
    const e = validarExtraordinaria(
      { ...valido, detalle: 'a', monto: '0', venceEl: '2026-10-01' },
      hoy,
    );
    expect(e.detalle).toBeDefined();
    expect(e.monto).toBe('El monto debe ser mayor a cero.');
    expect(e.venceEl).toBeDefined();
    expect(validarExtraordinaria({ ...valido, monto: '1.234' }, hoy).monto).toBeDefined();
  });
});

describe('textos', () => {
  it('responsable y rango', () => {
    expect(textoResponsable(null)).toBe('Sin responsable');
    expect(textoResponsable({ nombre: 'Diego Mora', relacion: 'inquilino' })).toBe(
      'Diego Mora · Inquilino',
    );
    expect(rangoDeCuenta('todo', '2026-10-09')).toEqual({});
    expect(rangoDeCuenta('anio', '2026-10-09')).toEqual({
      desde: '2026-01-01',
      hasta: '2026-10-09',
    });
    expect(esSaldoAFavor('-13.00')).toBe(true);
    expect(esSaldoAFavor('79.00')).toBe(false);
  });
  it('subtítulo del mes', () => {
    const base = {
      emitida: false,
      estado: null,
      emitido_en: null,
      metodo: null,
      dia_vencimiento: null,
    } as unknown as ResumenCuotas;
    expect(subtituloDelMes(base)).toBe('Aún no se emiten las cuotas de este mes.');
    expect(subtituloDelMes({ ...base, emitida: true, dia_vencimiento: 10, metodo: 'tipo' })).toBe(
      'vencen el día 10 · método: valor por tipo',
    );
  });
});

describe('services', () => {
  it('lista cuotas con filtro, búsqueda y página', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: [],
        meta: {
          periodo: '2026-10',
          resumen: { emitida: true },
          conteos: { todas: 0 },
          pagination: { page: 1, per_page: 25, total: 0, last_page: 1 },
        },
      },
    });
    const r = await cuotasService.listar({ filtro: 'vencida', buscar: ' A-1 ', pagina: 2 });
    expect(get).toHaveBeenCalledWith('/finanzas/cuotas', {
      params: { filtro: 'vencida', buscar: 'A-1', page: 2 },
    });
    expect(r.periodo).toBe('2026-10');
  });

  it('crea la extraordinaria y registra efectivo con montos en texto', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { ok: true } } });
    await cuotasService.crearExtraordinaria({
      detalle: 'x',
      periodo: '2026-10',
      vence_el: '2026-10-24',
      modo: 'alicuota',
      monto: '500.00',
    });
    expect(post.mock.calls[0]?.[0]).toBe('/finanzas/cuotas-extraordinarias');
    await estadoCuentaService.registrarEfectivo(5, '40.00');
    expect(post).toHaveBeenLastCalledWith('/unidades/5/pagos-efectivo', { monto: '40.00' });
  });

  it('pide el estado de cuenta con el rango', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    await estadoCuentaService.ver(5, { desde: '2026-08-01', hasta: '2026-10-09' });
    expect(get).toHaveBeenCalledWith('/unidades/5/estado-cuenta', {
      params: { desde: '2026-08-01', hasta: '2026-10-09' },
    });
  });
});
