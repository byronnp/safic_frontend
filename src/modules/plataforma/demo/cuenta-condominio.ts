// Datos de ejemplo del mockup F6CuentaCondominio.dc.html. Se reemplazan por la API cuando exista el endpoint.

import type { TonoEstado } from '@/components/EstadoBadge.vue';

export interface EstadoCuenta {
  texto: string;
  tono: TonoEstado;
}

export interface MovimientoCuentaCorriente {
  fecha: string;
  concepto: string;
  documento: string;
  debe: number | null;
  haber: number | null;
  saldo: number;
}

export interface FacturaCuenta {
  numero: string;
  periodo: string;
  emision: string;
  vence: string;
  total: number;
  estado: EstadoCuenta;
}

export interface PagoCuenta {
  fecha: string;
  numero: string;
  origen: string;
  referencia: string;
  monto: number;
  estado: EstadoCuenta;
}

export interface CuentaCondominio {
  codigo: string;
  nombre: string;
  suscripcion: EstadoCuenta;
  estadoPago: EstadoCuenta;
  plan: string;
  planDesde: string;
  unidades: number;
  valorUnidad: number;
  subtotal: number;
  ivaPorcentaje: number;
  iva: number;
  mensualidad: number;
  diaFacturacion: number;
  saldoPendiente: number;
  saldoNota: string;
  razonSocial: string;
  ruc: string;
  correoFacturas: string;
  unidadesRegistradas: number;
  movimientos: MovimientoCuentaCorriente[];
  facturas: FacturaCuenta[];
  pagos: PagoCuenta[];
}

const PAGADA: EstadoCuenta = { texto: 'Pagada', tono: 'exito' };
const APROBADO: EstadoCuenta = { texto: 'Aprobado', tono: 'exito' };

export const CUENTA_CONDOMINIO: CuentaCondominio = {
  codigo: 'CA-0002',
  nombre: 'Torres del Mirador',
  suscripcion: { texto: 'Suscripción activa', tono: 'exito' },
  estadoPago: { texto: 'Pendiente · vence 11 oct', tono: 'info' },
  plan: 'Profesional',
  planDesde: '01 mar 2026',
  unidades: 96,
  valorUnidad: 2.5,
  subtotal: 240,
  ivaPorcentaje: 15,
  iva: 36,
  mensualidad: 276,
  diaFacturacion: 1,
  saldoPendiente: 276,
  saldoNota: 'Factura de octubre',
  razonSocial: 'Condominio Torres del Mirador',
  ruc: '0992345678001',
  correoFacturas: 'administracion@torresmirador.ec',
  unidadesRegistradas: 91,
  movimientos: [
    {
      fecha: '01 ago 2026',
      concepto: 'Mensualidad agosto · 96 × $ 2,50 + IVA',
      documento: 'FAC 001-001-000231',
      debe: 276,
      haber: null,
      saldo: 276,
    },
    {
      fecha: '08 ago 2026',
      concepto: 'Pago · transferencia Banco Pichincha',
      documento: 'PAG-0412',
      debe: null,
      haber: 276,
      saldo: 0,
    },
    {
      fecha: '01 sep 2026',
      concepto: 'Mensualidad septiembre · 96 × $ 2,50 + IVA',
      documento: 'FAC 001-001-000268',
      debe: 276,
      haber: null,
      saldo: 276,
    },
    {
      fecha: '06 sep 2026',
      concepto: 'Pago · transferencia Produbanco',
      documento: 'PAG-0447',
      debe: null,
      haber: 276,
      saldo: 0,
    },
    {
      fecha: '01 oct 2026',
      concepto: 'Mensualidad octubre · 96 × $ 2,50 + IVA',
      documento: 'FAC 001-001-000302',
      debe: 276,
      haber: null,
      saldo: 276,
    },
  ],
  facturas: [
    {
      numero: '001-001-000302',
      periodo: 'Octubre 2026',
      emision: '01 oct',
      vence: '11 oct',
      total: 276,
      estado: { texto: 'Pendiente', tono: 'info' },
    },
    {
      numero: '001-001-000268',
      periodo: 'Septiembre 2026',
      emision: '01 sep',
      vence: '11 sep',
      total: 276,
      estado: PAGADA,
    },
    {
      numero: '001-001-000231',
      periodo: 'Agosto 2026',
      emision: '01 ago',
      vence: '11 ago',
      total: 276,
      estado: PAGADA,
    },
    {
      numero: '001-001-000197',
      periodo: 'Julio 2026',
      emision: '01 jul',
      vence: '11 jul',
      total: 276,
      estado: PAGADA,
    },
  ],
  pagos: [
    {
      fecha: '06 sep 2026',
      numero: 'PAG-0447',
      origen: 'Transferencia Produbanco · conciliado',
      referencia: '88120394',
      monto: 276,
      estado: APROBADO,
    },
    {
      fecha: '08 ago 2026',
      numero: 'PAG-0412',
      origen: 'Transferencia Pichincha · conciliado',
      referencia: '10293847',
      monto: 276,
      estado: APROBADO,
    },
    {
      fecha: '09 jul 2026',
      numero: 'PAG-0381',
      origen: 'Comprobante subido por el administrador',
      referencia: '77201934',
      monto: 276,
      estado: APROBADO,
    },
  ],
};
