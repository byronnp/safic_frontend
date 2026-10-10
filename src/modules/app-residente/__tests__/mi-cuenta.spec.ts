import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';
import { aCentavos, deCentavos, sumaCentavos } from '@/utils/dinero';
import { mesEnFrase, nombreMes } from '@/utils/periodo';

import { clavesMiCuenta } from '../composables/useMiCuenta';
import {
  cuotasLibres,
  errorArchivoComprobante,
  errorNumeroComprobante,
  mesCuota,
  mesesDelPago,
  montoATransferir,
  notaCuota,
  totalSeleccion,
  unidadInicial,
} from '../mi-cuenta.logica';
import {
  miCuentaService,
  type CuotaCuenta,
  type UnidadCuenta,
} from '../services/mi-cuenta.service';

afterEach(() => vi.restoreAllMocks());

function cuota(cambios: Partial<CuotaCuenta> = {}): CuotaCuenta {
  return {
    id: 1,
    periodo: '2026-07',
    concepto: 'ordinaria',
    monto: '80.00',
    saldo: '80.00',
    vence_el: '2026-07-10',
    estado: 'vencida',
    ...cambios,
  };
}

function unidad(cambios: Partial<UnidadCuenta> = {}): UnidadCuenta {
  return {
    unidad_id: 1,
    codigo: 'A-102',
    relacion: 'propietario',
    puede_pagar: true,
    encabezado: 'Jardines del Valle · A-102',
    concepto_transferencia: 'JV-A102',
    total_pendiente: '0.00',
    vencidas: 0,
    saldo_favor: '0.00',
    cuotas: [],
    pagos: [],
    ...cambios,
  };
}

describe('dinero en centavos', () => {
  it('convierte y suma sin decimales de float', () => {
    expect(aCentavos('80.00')).toBe(8000);
    expect(aCentavos('0.1')).toBe(10);
    expect(aCentavos('-13.00')).toBe(-1300);
    expect(deCentavos(1232050)).toBe('12320.50');
    expect(deCentavos(5)).toBe('0.05');
    expect(sumaCentavos(['0.10', '0.20', '0.30'])).toBe(60);
  });
});

describe('periodos', () => {
  it('nombra el mes', () => {
    expect(nombreMes('2026-09')).toBe('Septiembre 2026');
    expect(mesEnFrase('2026-01')).toBe('enero');
  });
});

describe('claves de caché', () => {
  it('incluyen el condominio', () => {
    expect(clavesMiCuenta.todas(7)).toEqual(['mi-cuenta', 7]);
    expect(clavesMiCuenta.todas(8)).not.toEqual(clavesMiCuenta.todas(7));
  });
});

describe('cuotas de mi cuenta', () => {
  it('dice cuándo vence y marca las que van en revisión', () => {
    expect(notaCuota(cuota({ estado: 'vencida', vence_el: '2026-07-10' }))).toBe(
      'Vencida el 10 jul',
    );
    expect(notaCuota(cuota({ estado: 'pendiente', vence_el: '2026-10-10' }))).toBe(
      'Vence el 10 oct',
    );
    expect(notaCuota(cuota({ estado: 'en_revision' }))).toBe('En revisión');
    expect(mesCuota(cuota({ concepto: 'extraordinaria' }))).toBe('Julio 2026 · extraordinaria');
  });

  it('solo se pueden elegir las que no van en un pago en revisión', () => {
    const u = unidad({
      cuotas: [cuota({ id: 1, estado: 'en_revision' }), cuota({ id: 2 }), cuota({ id: 3 })],
    });
    expect(cuotasLibres(u).map((c) => c.id)).toEqual([2, 3]);
  });

  it('el total son las primeras cuotas, de la más antigua en adelante', () => {
    const libres = [
      cuota({ id: 1, saldo: '80.00' }),
      cuota({ id: 2, saldo: '45.50' }),
      cuota({ id: 3, saldo: '80.00' }),
    ];
    expect(totalSeleccion(libres, 2)).toBe(12550);
    expect(totalSeleccion(libres, 0)).toBe(0);
  });

  it('el saldo a favor se descuenta del monto y nunca lo deja negativo', () => {
    const libres = [cuota({ saldo: '80.00' }), cuota({ id: 2, saldo: '80.00' })];
    expect(montoATransferir(libres, 2, '0.00')).toBe(16000);
    expect(montoATransferir(libres, 2, '20.00')).toBe(14000);
    expect(montoATransferir(libres, 1, '500.00')).toBe(0);
  });

  it('muestra los meses de un pago', () => {
    expect(mesesDelPago({ cuotas: ['2026-07', '2026-08'] })).toBe('Julio, Agosto');
    expect(mesesDelPago({ cuotas: [] })).toBe('—');
  });
});

describe('unidad inicial', () => {
  it('prefiere la pedida, luego la primera que puede pagar', () => {
    const a = unidad({ unidad_id: 1, puede_pagar: false });
    const b = unidad({ unidad_id: 2, puede_pagar: true });
    expect(unidadInicial([a, b])?.unidad_id).toBe(2);
    expect(unidadInicial([a, b], 1)?.unidad_id).toBe(1);
    expect(unidadInicial([a])?.unidad_id).toBe(1);
    expect(unidadInicial([])).toBeUndefined();
  });
});

describe('comprobante', () => {
  it('valida el número', () => {
    expect(errorNumeroComprobante('004518823')).toBeNull();
    expect(errorNumeroComprobante('')).toBe('Escribe el número del comprobante.');
    expect(errorNumeroComprobante('12')).toBe('El número del comprobante es muy corto.');
    expect(errorNumeroComprobante('<script>')).toBe(
      'El número del comprobante solo lleva letras, números y guiones.',
    );
  });

  it('valida el archivo: JPG, PNG o PDF de hasta 5 MB', () => {
    expect(errorArchivoComprobante({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(errorArchivoComprobante({ type: 'application/pdf', size: 1000 })).toBeNull();
    expect(errorArchivoComprobante(null)).toBe('Sube la foto o el PDF del comprobante.');
    expect(errorArchivoComprobante({ type: 'image/svg+xml', size: 10 })).toBe(
      'El comprobante debe ser una foto (JPG o PNG) o un PDF.',
    );
    expect(errorArchivoComprobante({ type: 'image/png', size: 6 * 1024 * 1024 })).toBe(
      'El comprobante pesa más de 5 MB.',
    );
  });
});

describe('miCuentaService', () => {
  it('consulta la cuenta y envía el pago como multipart', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { unidades: [] } } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: { pago_id: 9 } } });

    await miCuentaService.ver();
    await miCuentaService.pagar({
      unidadId: 3,
      cuotas: [4, 5],
      numeroComprobante: '004518823',
      comprobante: new File(['x'], 'foto.jpg', { type: 'image/jpeg' }),
    });

    expect(get).toHaveBeenCalledWith('/mi-cuenta');
    const [ruta, formulario] = post.mock.calls[0] as [string, FormData];
    expect(ruta).toBe('/mi-cuenta/pagos');
    expect(formulario.get('unidad_id')).toBe('3');
    expect(formulario.getAll('cuotas[]')).toEqual(['4', '5']);
    expect(formulario.get('numero_comprobante')).toBe('004518823');
    expect((formulario.get('comprobante') as File).name).toBe('foto.jpg');
  });
});
