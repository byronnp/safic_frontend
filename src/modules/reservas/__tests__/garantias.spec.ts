import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesGarantias } from '../composables/useGarantias';
import {
  aDevolucion,
  devolucionVacia,
  textoEstadoGarantia,
  textoGarantiaResidente,
  validarDevolucion,
} from '../garantias.logica';
import { garantiasService } from '../services/garantias.service';

afterEach(() => vi.restoreAllMocks());

const HOY = '2026-10-18';
const USO = '2026-10-17';

describe('garantías de reservas', () => {
  it('describe cada estado en la lista de la administración', () => {
    expect(
      textoEstadoGarantia({ estado: 'esperando_decision', monto: '0.00', devolucion: null }),
    ).toBe('Falta decidir los daños');
    expect(
      textoEstadoGarantia({ estado: 'por_devolver', monto: '29.50', devolucion: null }),
    ).toContain('29,50');
    const devuelta = textoEstadoGarantia({
      estado: 'devuelta',
      monto: '50.00',
      devolucion: { forma: 'transferencia', fecha: USO, referencia: '884512' },
    });
    expect(devuelta).toContain('Devuelta');
    expect(devuelta).toContain('transferencia');
  });

  it('le dice al residente qué pasa con su garantía, o nada', () => {
    const base = { garantia_monto: '100.00', garantia_devuelta_en: null };

    expect(textoGarantiaResidente({ ...base, garantia_estado: 'esperando_decision' })).toMatch(
      /revisión/,
    );
    expect(textoGarantiaResidente({ ...base, garantia_estado: 'por_devolver' })).toContain(
      '100,00',
    );
    expect(
      textoGarantiaResidente({ ...base, garantia_estado: 'devuelta', garantia_devuelta_en: USO }),
    ).toMatch(/devuelta el/);
    expect(textoGarantiaResidente({ ...base, garantia_estado: 'sin_devolucion' })).toMatch(
      /cubrió/,
    );
    expect(textoGarantiaResidente({ ...base, garantia_estado: null })).toBeNull();
  });

  it('valida forma, fecha (ni futura ni anterior al uso) y referencia de la transferencia', () => {
    const f = (cambios: Partial<ReturnType<typeof devolucionVacia>>) => ({
      ...devolucionVacia(HOY),
      forma: 'efectivo' as const,
      ...cambios,
    });

    expect(validarDevolucion(devolucionVacia(HOY), HOY, USO).forma).toBeDefined();
    expect(validarDevolucion(f({}), HOY, USO)).toEqual({});
    expect(validarDevolucion(f({ fecha: '2026-10-19' }), HOY, USO).fecha).toMatch(/futura/);
    expect(validarDevolucion(f({ fecha: '2026-10-16' }), HOY, USO).fecha).toMatch(/anterior/);
    expect(validarDevolucion(f({ fecha: '' }), HOY, USO).fecha).toBeDefined();
    expect(validarDevolucion(f({ forma: 'transferencia' }), HOY, USO).referencia).toBeDefined();
    expect(
      validarDevolucion(f({ forma: 'transferencia', referencia: '884512' }), HOY, USO),
    ).toEqual({});
    expect(validarDevolucion(f({ referencia: 'x'.repeat(41) }), HOY, USO).referencia).toBeDefined();
  });

  it('arma la solicitud con la referencia recortada y sin monto (lo calcula el servidor)', () => {
    expect(aDevolucion({ forma: 'efectivo', fecha: HOY, referencia: '  ' })).toEqual({
      forma: 'efectivo',
      fecha: HOY,
    });
    expect(aDevolucion({ forma: 'transferencia', fecha: HOY, referencia: ' 884512 ' })).toEqual({
      forma: 'transferencia',
      fecha: HOY,
      referencia: '884512',
    });
  });

  it('la clave de caché lleva el condominio y el servicio usa las rutas del contrato', async () => {
    expect(clavesGarantias.lista(7)).toEqual(['reservas', 7, 'garantias']);
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });

    await garantiasService.lista();
    await garantiasService.devolver(5, { forma: 'efectivo', fecha: HOY });

    expect(get).toHaveBeenCalledWith('/areas-comunes/garantias');
    expect(post).toHaveBeenCalledWith('/areas-comunes/reservas/5/garantia/devolver', {
      forma: 'efectivo',
      fecha: HOY,
    });
  });
});
