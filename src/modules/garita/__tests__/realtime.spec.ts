import { describe, expect, it, vi } from 'vitest';

import { invalidarPorAviso } from '@/core/realtime/avisos';

import { consultasDeGarita } from '../realtime';

function invalidadas(recurso: string, condominioId: number): unknown[] {
  const qc = { invalidateQueries: vi.fn().mockResolvedValue(undefined) };
  invalidarPorAviso(consultasDeGarita, { recurso, id: 1 }, condominioId, qc);
  return qc.invalidateQueries.mock.calls.map(([f]) => (f as { queryKey: unknown }).queryKey);
}

describe('avisos en vivo de la garita', () => {
  it('una solicitud de ingreso refresca la lista del residente y el panel del guardia', () => {
    expect(invalidadas('solicitudes-ingreso', 7)).toEqual([
      ['visitas', 7, 'solicitudes'],
      ['garita', 7, 'panel'],
    ]);
  });

  it('paquetes y accesos refrescan sus consultas', () => {
    expect(invalidadas('paquetes', 7)).toEqual([['paquetes', 7]]);
    expect(invalidadas('accesos', 7)).toEqual([['visitas', 7]]);
  });

  it('todas las claves llevan el condominio activo', () => {
    for (const recurso of Object.keys(consultasDeGarita)) {
      for (const clave of invalidadas(recurso, 9)) {
        expect((clave as unknown[])[1]).toBe(9);
      }
    }
  });
});
