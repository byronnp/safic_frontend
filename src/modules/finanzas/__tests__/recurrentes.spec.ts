import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';
import { formatoMoneda } from '@/utils/formato';

import { clavesRecurrentes } from '../composables/useRecurrentes';
import {
  cambiosDeRecurrente,
  ESTADO_MES,
  formularioDeRecurrente,
  peticionRecurrente,
  recurrenteVacio,
  textoDia,
  textoMonto,
  textoProximo,
  validarRecurrente,
} from '../recurrentes.logica';
import { recurrentesService, type GastoRecurrente } from '../services/recurrentes.service';

afterEach(() => vi.restoreAllMocks());

const guardia = {
  id: 3,
  nombre: 'Guardianía',
  proveedor: { id: 9, razon_social: 'Seguridad Integral' },
  categoria: 'Guardianía',
  monto: '4480.00',
  dia_mes: 1,
  activo: true,
  aprobacion_automatica: true,
  mes: {
    estado: 'falta_factura',
    fecha_prevista: '2026-10-01',
    gasto_id: null,
    aprobada_automaticamente: false,
  },
} as GastoRecurrente;

describe('gastos recurrentes', () => {
  it('las claves de caché incluyen el condominio', () => {
    expect(clavesRecurrentes.lista(7, '2026-10')).toEqual([
      'finanzas',
      7,
      'recurrentes',
      '2026-10',
    ]);
    expect(clavesRecurrentes.facturas(7, 3)).toEqual(['finanzas', 7, 'recurrentes-facturas', 3]);
    expect(clavesRecurrentes.lista(8, '2026-10')).not.toEqual(
      clavesRecurrentes.lista(7, '2026-10'),
    );
  });

  it('textos de la tabla', () => {
    expect(ESTADO_MES.falta_factura).toMatchObject({ texto: 'Falta la factura', tono: 'alerta' });
    expect(ESTADO_MES.factura_recibida.tono).toBe('exito');
    expect(textoDia(15)).toBe('Día 15');
    expect(textoMonto(guardia, formatoMoneda)).toBe('$ 4.480,00');
    expect(textoMonto({ monto: null }, formatoMoneda)).toBe('Variable');
    expect(textoProximo({ nombre: 'Agua', fecha: '2026-10-08' })).toBe('Agua · 8 oct');
    expect(textoProximo(null)).toBe('—');
  });

  it('valida: nombre, proveedor, monto (o variable) y día del 1 al 28', () => {
    const ok = {
      ...recurrenteVacio(),
      nombre: 'Limpieza',
      proveedorId: 4,
      monto: '1250,00',
      dia: '5',
    };
    expect(validarRecurrente(ok)).toEqual({});
    expect(validarRecurrente({ ...ok, variable: true, monto: '' })).toEqual({});
    expect(
      Object.keys(validarRecurrente({ ...recurrenteVacio(), dia: '29', monto: '0' })).sort(),
    ).toEqual(['dia', 'monto', 'nombre', 'proveedorId']);
  });

  it('un gasto variable no manda monto ni aprobación automática', () => {
    const f = {
      ...recurrenteVacio(),
      nombre: 'Luz áreas comunes',
      proveedorId: 4,
      variable: true,
      aprobacionAutomatica: true,
      dia: '5',
    };
    expect(peticionRecurrente(f)).toMatchObject({
      monto: null,
      aprobacion_automatica: false,
      dia_mes: 5,
      categoria: null,
    });
    expect(peticionRecurrente({ ...f, variable: false, monto: '1250,5' })).toMatchObject({
      monto: '1250.50',
      aprobacion_automatica: true,
    });
  });

  it('al editar envía solo lo que cambió', () => {
    expect(cambiosDeRecurrente(guardia, formularioDeRecurrente(guardia))).toEqual({});
    expect(
      cambiosDeRecurrente(guardia, {
        ...formularioDeRecurrente(guardia),
        nombre: 'Guardianía 24 h',
        monto: '4600',
        dia: '2',
      }),
    ).toEqual({
      nombre: 'Guardianía 24 h',
      monto: '4600.00',
      dia_mes: 2,
    });
    expect(
      cambiosDeRecurrente(guardia, { ...formularioDeRecurrente(guardia), variable: true }),
    ).toEqual({ monto: null, aprobacion_automatica: false });
  });

  it('usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: [],
        meta: { resumen: { comprometido: '0.00', por_adjuntar: 0, proximo: null } },
      },
    });
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { data: {}, meta: { aprobada_automaticamente: true } } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: {} } });
    await recurrentesService.listar('2026-10');
    expect(get).toHaveBeenCalledWith('/finanzas/recurrentes', { params: { periodo: '2026-10' } });
    await recurrentesService.facturas(3);
    expect(get).toHaveBeenLastCalledWith('/finanzas/recurrentes/3/facturas');
    await recurrentesService.editar(3, { activo: false });
    expect(patch).toHaveBeenCalledWith('/finanzas/recurrentes/3', { activo: false });
    const r = await recurrentesService.vincular(3, '2026-10', 44);
    expect(post).toHaveBeenLastCalledWith('/finanzas/recurrentes/3/factura', {
      periodo: '2026-10',
      gasto_id: 44,
    });
    expect(r.aprobadaAutomaticamente).toBe(true);
  });

  it('rechaza una lista sin resumen', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [], meta: {} } });
    await expect(recurrentesService.listar('2026-10')).rejects.toThrow();
  });
});
