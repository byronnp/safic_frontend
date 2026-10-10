import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import { clavesGastos } from '../composables/useGastos';
import { clavesProveedores } from '../composables/useProveedores';
import {
  cuentaVacia,
  estadoProveedor,
  facturaVacia,
  ivaDe,
  peticionFactura,
  peticionProveedor,
  proveedorVacio,
  textoVence,
  totalDe,
  validarCuenta,
  validarFactura,
  validarProveedor,
} from '../proveedores.logica';
import { gastosService } from '../services/gastos.service';
import { proveedoresService } from '../services/proveedores.service';

afterEach(() => vi.restoreAllMocks());

describe('claves de caché', () => {
  it('incluyen el condominio y cuelgan de las de finanzas', () => {
    expect(clavesProveedores.lista(7, 'todos', ' a ')).toEqual([
      'finanzas',
      7,
      'proveedores',
      'todos',
      'a',
    ]);
    expect(clavesGastos.lista(7, 'todas', '')).toEqual(['finanzas', 7, 'gastos', 'todas', '']);
    expect(clavesGastos.lista(8, 'todas', '')).not.toEqual(clavesGastos.lista(7, 'todas', ''));
  });
});

describe('IVA de factura manual', () => {
  it('es el 15 % redondeado al centavo, igual que la API', () => {
    expect(ivaDe('2400.33', true)).toBe('360.05');
    expect(totalDe('2400.33', true)).toBe('2760.38');
    expect(ivaDe('100.00', false)).toBe('0.00');
    expect(totalDe('100.00', false)).toBe('100.00');
  });
});

describe('formularios', () => {
  it('proveedor: RUC de 13 dígitos y nombre; el correo es opcional', () => {
    expect(
      validarProveedor({ ...proveedorVacio(), ruc: '123', razon_social: 'ab' }, true),
    ).toMatchObject({
      ruc: 'El RUC tiene 13 dígitos.',
      razon_social: 'Escribe el nombre del proveedor.',
    });
    const ok = { ...proveedorVacio(), ruc: '1790876543001', razon_social: 'Ascensores Andinos' };
    expect(validarProveedor(ok, true)).toEqual({});
    expect(validarProveedor({ ...ok, email: 'mal' }, true).email).toBeDefined();
    expect(validarProveedor({ ...ok, ruc: '' }, false)).toEqual({});
    expect(peticionProveedor(ok)).toMatchObject({ categoria: null, email: null, telefono: null });
  });

  it('cuenta: número con dígitos y guiones y contraseña obligatoria', () => {
    const base = {
      ...cuentaVacia('Titular S.A.'),
      banco: 'Produbanco',
      numero: '02005-1234-87',
      password: 'x',
    };
    expect(validarCuenta(base)).toEqual({});
    expect(validarCuenta({ ...base, numero: 'abc', password: '' })).toMatchObject({
      numero: expect.any(String),
      password: 'Escribe tu contraseña para confirmar el cambio.',
    });
  });

  it('factura: formato de número, fecha no futura, vencimiento y subtotal', () => {
    const hoy = '2026-10-09';
    const ok = {
      ...facturaVacia(hoy),
      proveedorId: 3,
      numero: '001-002-000004512',
      subtotal: '2400,33',
    };
    expect(validarFactura(ok, hoy)).toEqual({});
    expect(peticionFactura(ok)).toMatchObject({
      subtotal: '2400.33',
      vence_el: null,
      proveedor_id: 3,
    });

    const e = validarFactura(
      {
        ...ok,
        proveedorId: null,
        numero: '1-2-3',
        fechaEmision: '2026-10-10',
        venceEl: '2026-10-01',
        subtotal: '0',
      },
      hoy,
    );
    expect(Object.keys(e).sort()).toEqual([
      'fechaEmision',
      'numero',
      'proveedorId',
      'subtotal',
      'venceEl',
    ]);
    expect(validarFactura({ ...ok, venceEl: '2026-10-01' }, hoy).venceEl).toBeDefined();
  });
});

describe('textos', () => {
  it('estado del proveedor y vencimiento de la factura', () => {
    expect(estadoProveedor('sin_facturas', null).texto).toBe('Sin facturas');
    expect(estadoProveedor('al_dia', null).tono).toBe('exito');
    expect(estadoProveedor('vence_pronto', '2026-10-12').texto).toMatch(/^Vence 12 oct/);
    expect(textoVence({ vence_el: '2026-09-20', vencida: true, estado: 'aprobada' })).toMatch(
      /^Venció el/,
    );
    expect(textoVence({ vence_el: '2026-09-20', vencida: false, estado: 'pagada' })).not.toMatch(
      /Vence/,
    );
  });
});

describe('services', () => {
  it('lista proveedores con filtro y búsqueda', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: [], meta: { conteos: { todos: 0, con_saldo: 0, cuenta_en_cambio: 0 } } },
    });
    await proveedoresService.listar('con_saldo', ' ascen ');
    expect(get).toHaveBeenCalledWith('/proveedores', {
      params: { filtro: 'con_saldo', buscar: 'ascen' },
    });
  });

  it('cambia y detiene la cuenta en las rutas del contrato', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: { data: {} } });
    await proveedoresService.cambiarCuenta(4, {
      banco: 'B',
      tipo: 'corriente',
      numero: '123456',
      titular: 'T',
      password: 'p',
    });
    expect(post.mock.calls[0]?.[0]).toBe('/proveedores/4/cuenta-bancaria');
    await proveedoresService.detenerCambio(4);
    expect(del).toHaveBeenCalledWith('/proveedores/4/cuenta-bancaria/pendiente');
  });

  it('sube el XML como multipart y registra a mano con montos en texto', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    const xml = new File(['<factura/>'], 'f.xml', { type: 'text/xml' });
    await gastosService.importarXml({ xml, pdf: null, vence_el: null });
    expect(post.mock.calls[0]?.[0]).toBe('/gastos/importar-xml');
    const formulario = post.mock.calls[0]?.[1] as FormData;
    expect(formulario.get('xml')).toBeInstanceOf(File);
    expect(formulario.has('pdf')).toBe(false);

    await gastosService.registrar({
      proveedor_id: 1,
      numero: '001-001-000000001',
      fecha_emision: '2026-10-01',
      vence_el: null,
      subtotal: '10.00',
      con_iva: true,
      categoria: null,
      descripcion: null,
    });
    expect(post.mock.calls[1]?.[0]).toBe('/gastos');
  });

  it('rechaza una lista de gastos sin resumen', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [], meta: {} } });
    await expect(gastosService.listar('todas', '')).rejects.toThrow();
  });
});
