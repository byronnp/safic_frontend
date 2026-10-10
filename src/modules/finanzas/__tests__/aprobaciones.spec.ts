import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesGasto } from '../composables/useGastos';
import {
  avisoDePago,
  estadoVisualGasto,
  nivelQuePuedeDar,
  pagoProveedorVacio,
  peticionPagoProveedor,
  saldoElegido,
  textoAprobacion,
  validarMotivo,
  validarPagoProveedor,
} from '../proveedores.logica';
import type { Gasto } from '../services/gastos.service';
import { gastosService } from '../services/gastos.service';
import { pagosProveedorService } from '../services/pagos-proveedor.service';

afterEach(() => vi.restoreAllMocks());

const factura = (id: number, saldo: string): Gasto => ({ id, saldo }) as Gasto;

describe('estado y nivel de aprobación', () => {
  it('junta estado, nivel que falta y abonos', () => {
    expect(
      estadoVisualGasto({ estado: 'por_aprobar', nivel_pendiente: 2, pagada_parcial: false }).texto,
    ).toBe('Falta 2.ª aprobación');
    expect(
      estadoVisualGasto({ estado: 'por_aprobar', nivel_pendiente: 1, pagada_parcial: false }).texto,
    ).toBe('Por aprobar');
    expect(
      estadoVisualGasto({ estado: 'aprobada', nivel_pendiente: null, pagada_parcial: true }).texto,
    ).toBe('Pagada parcial');
    expect(
      estadoVisualGasto({ estado: 'rechazada', nivel_pendiente: null, pagada_parcial: false }).tono,
    ).toBe('error');
  });

  it('ofrece solo el nivel que la persona puede dar', () => {
    const tiene = (permisos: string[]) => (p: string) => permisos.includes(p);
    const g = { estado: 'por_aprobar', nivel_pendiente: 2 } as const;
    expect(nivelQuePuedeDar(g, tiene(['gastos.aprobar-n2']))).toBe(2);
    expect(nivelQuePuedeDar(g, tiene(['gastos.aprobar-n1']))).toBeNull();
    expect(
      nivelQuePuedeDar({ estado: 'aprobada', nivel_pendiente: null }, tiene(['gastos.aprobar-n1'])),
    ).toBeNull();
  });

  it('describe la aprobación y marca la subrogación', () => {
    const a = {
      nivel: 2,
      decision: 'aprobada',
      por: 'Paola Cedeño',
      comentario: null,
      en_subrogacion: true,
      en: null,
    } as const;
    expect(textoAprobacion(a)).toContain('en subrogación');
    expect(validarMotivo(' ')).toBe('Escribe el motivo del rechazo.');
    expect(validarMotivo('no')).toBe('El motivo es muy corto.');
    expect(validarMotivo('Monto distinto')).toBeUndefined();
  });
});

describe('pago a proveedor', () => {
  const lista = [factura(1, '800.00'), factura(2, '350.00'), factura(3, '99.00')];

  it('suma el saldo de lo elegido', () => {
    expect(saldoElegido(lista, [1, 2])).toBe(115000);
    expect(saldoElegido(lista, [])).toBe(0);
  });

  it('avisa según el monto: falta elegir, monto de más, abono y pago completo', () => {
    expect(avisoDePago(0, '10').tono).toBe('info');
    expect(avisoDePago(115000, '').tono).toBe('error');
    expect(avisoDePago(115000, '1150,01').tono).toBe('error');
    expect(avisoDePago(115000, '800').texto).toMatch(/^Abono de .* queda un saldo de/);
    expect(avisoDePago(115000, '1150.00').tono).toBe('exito');
  });

  it('valida el formulario y arma la petición con el monto en texto', () => {
    const hoy = '2026-10-09';
    const base = {
      ...pagoProveedorVacio(hoy, 4),
      facturas: [1],
      monto: '800,00',
      cuentaBancariaId: 2,
      referencia: 'TRX-004512',
    };
    expect(validarPagoProveedor(base, 80000, hoy)).toEqual({});
    expect(peticionPagoProveedor(base, null)).toMatchObject({
      monto: '800.00',
      proveedor_id: 4,
      facturas: [1],
    });

    const e = validarPagoProveedor(
      {
        ...base,
        proveedorId: null,
        facturas: [],
        monto: '900',
        cuentaBancariaId: null,
        fechaPago: '2026-10-10',
        referencia: '$',
      },
      80000,
      hoy,
    );
    expect(Object.keys(e).sort()).toEqual([
      'cuentaBancariaId',
      'facturas',
      'fechaPago',
      'monto',
      'proveedorId',
      'referencia',
    ]);
  });
});

describe('services y claves', () => {
  it('la clave del detalle incluye el condominio', () => {
    expect(clavesGasto.detalle(7, 3)).toEqual(['finanzas', 7, 'gasto', 3]);
    expect(clavesGasto.detalle(8, 3)).not.toEqual(clavesGasto.detalle(7, 3));
  });

  it('aprueba y rechaza en las rutas del contrato', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    await gastosService.aprobar(5, 'Cotización más baja');
    expect(post).toHaveBeenLastCalledWith('/gastos/5/aprobar', {
      comentario: 'Cotización más baja',
    });
    await gastosService.rechazar(5, 'No coincide');
    expect(post).toHaveBeenLastCalledWith('/gastos/5/rechazar', { motivo: 'No coincide' });
  });

  it('registra el pago como multipart con las facturas y sin comprobante si no hay', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    await pagosProveedorService.registrar({
      proveedor_id: 4,
      facturas: [1, 2],
      monto: '800.00',
      cuenta_bancaria_id: 2,
      fecha_pago: '2026-10-09',
      referencia: 'TRX-1',
      comprobante: null,
    });
    expect(post.mock.calls[0]?.[0]).toBe('/pagos-proveedor');
    const f = post.mock.calls[0]?.[1] as FormData;
    expect(f.getAll('facturas[]')).toEqual(['1', '2']);
    expect(f.get('monto')).toBe('800.00');
    expect(f.has('comprobante')).toBe(false);

    await pagosProveedorService.anular(9, 'Mal registrado');
    expect(post).toHaveBeenLastCalledWith('/pagos-proveedor/9/anular', {
      motivo: 'Mal registrado',
    });
  });
});
