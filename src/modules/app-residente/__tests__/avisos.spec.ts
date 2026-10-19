import { describe, expect, it } from 'vitest';

import { notificacionesDeCuotas } from '../avisos.logica';
import type { CuotaCuenta, UnidadCuenta } from '../services/mi-cuenta.service';

function cuota(cambios: Partial<CuotaCuenta> = {}): CuotaCuenta {
  return {
    id: 1,
    periodo: '2026-10',
    concepto: 'ordinaria',
    monto: '92.00',
    saldo: '92.00',
    vence_el: '2026-10-10',
    estado: 'pendiente',
    ...cambios,
  };
}

function unidad(cuotas: CuotaCuenta[], cambios: Partial<UnidadCuenta> = {}): UnidadCuenta {
  return {
    unidad_id: 1,
    codigo: 'A-102',
    relacion: 'propietario',
    puede_pagar: true,
    encabezado: 'A-102',
    concepto_transferencia: 'A-102',
    total_pendiente: '0.00',
    vencidas: 0,
    saldo_favor: '0.00',
    cuotas,
    pagos: [],
    ...cambios,
  };
}

describe('notificaciones de cuotas', () => {
  it('avisa la cuota disponible con su monto y vencimiento', () => {
    const [aviso] = notificacionesDeCuotas([unidad([cuota()])]);

    expect(aviso).toMatchObject({
      titulo: 'Tu cuota de octubre está disponible',
      vencida: false,
    });
    expect(aviso?.detalle).toContain('92,00');
    expect(aviso?.detalle).toContain('vence el');
  });

  it('junta las vencidas en un solo aviso, con su total, y las pone primero', () => {
    const avisos = notificacionesDeCuotas([
      unidad([
        cuota({ id: 1, periodo: '2026-08', vence_el: '2026-08-10', estado: 'vencida' }),
        cuota({ id: 2, periodo: '2026-09', vence_el: '2026-09-10', estado: 'vencida' }),
        cuota({ id: 3 }),
      ]),
    ]);

    expect(avisos.map((a) => a.titulo)).toEqual([
      'Tienes 2 cuotas vencidas',
      'Tu cuota de octubre está disponible',
    ]);
    expect(avisos[0]).toMatchObject({ vencida: true });
    expect(avisos[0]?.detalle).toContain('184,00');
  });

  it('con una sola vencida lo dice en singular', () => {
    const [aviso] = notificacionesDeCuotas([unidad([cuota({ estado: 'vencida' })])]);

    expect(aviso?.titulo).toBe('Tienes una cuota vencida');
  });

  it('no avisa lo que ya va en un pago en revisión ni lo que no tiene saldo', () => {
    expect(
      notificacionesDeCuotas([
        unidad([cuota({ id: 1, estado: 'en_revision' }), cuota({ id: 2, saldo: '0.00' })]),
      ]),
    ).toEqual([]);
  });

  it('avisa la próxima por vencer (la más cercana), no todas', () => {
    const avisos = notificacionesDeCuotas([
      unidad([
        cuota({ id: 5, periodo: '2026-12', vence_el: '2026-12-10' }),
        cuota({ id: 4, periodo: '2026-11', vence_el: '2026-11-10' }),
      ]),
    ]);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]?.titulo).toBe('Tu cuota de noviembre está disponible');
  });

  it('con varias unidades indica de cuál es cada aviso', () => {
    const avisos = notificacionesDeCuotas([
      unidad([cuota({ id: 1 })]),
      unidad([cuota({ id: 2 })], { unidad_id: 2, codigo: 'B-9' }),
    ]);

    expect(avisos.map((a) => a.detalle.split(' · ').at(-1))).toEqual(['A-102', 'B-9']);
  });

  it('sin deudas no hay avisos', () => {
    expect(notificacionesDeCuotas([unidad([])])).toEqual([]);
  });
});
