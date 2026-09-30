// Datos de ejemplo del mockup F6Configuracion.dc.html. Se reemplazan por la API cuando exista el endpoint.

import type { TonoEstado } from '@/components/EstadoBadge.vue';

export interface CuentaBancariaPlataforma {
  id: number;
  iniciales: string;
  /** Color de marca del banco (fijo, no depende del condominio). */
  color: string;
  banco: string;
  detalle: string;
  estado: string;
  tono: TonoEstado;
  /** Cuenta nueva que espera 24 h antes de activarse. */
  pendiente: boolean;
}

export interface CambioPendienteCobro {
  cuentaId: number;
  cuenta: string;
  agregadaPor: string;
  agregadaEl: string;
  seActiva: string;
  superAdministradores: number;
}

export interface EmisorCobro {
  razonSocial: string;
  ruc: string;
  iva: string;
  establecimiento: string;
  puntoEmision: string;
  diaFacturacion: string;
  diasPagar: string;
  direccionMatriz: string;
  proveedor: string;
}

export const CUENTAS_COBRO: CuentaBancariaPlataforma[] = [
  {
    id: 1,
    iniciales: 'BP',
    color: '#1F4C9A',
    banco: 'Banco Pichincha',
    detalle: 'Corriente ···· 8812 · SAFIC S.A.S. · RUC 0993456789001',
    estado: 'Principal',
    tono: 'exito',
    pendiente: false,
  },
  {
    id: 2,
    iniciales: 'PB',
    color: '#0F7A4A',
    banco: 'Produbanco',
    detalle: 'Ahorros ···· 3021 · SAFIC S.A.S.',
    estado: 'Activa',
    tono: 'neutro',
    pendiente: false,
  },
  {
    id: 3,
    iniciales: 'BI',
    color: '#B8641C',
    banco: 'Banco Internacional',
    detalle: 'Corriente ···· 4417 · SAFIC S.A.S.',
    estado: 'Se activa en 23 h',
    tono: 'alerta',
    pendiente: true,
  },
];

export const CAMBIO_PENDIENTE_COBRO: CambioPendienteCobro = {
  cuentaId: 3,
  cuenta: 'Banco Internacional ···· 4417',
  agregadaPor: 'Andrés Mora',
  agregadaEl: '26 sep 10:14',
  seActiva: '27 sep a las 10:14',
  superAdministradores: 2,
};

export const EMISOR_COBRO: EmisorCobro = {
  razonSocial: 'SAFIC S.A.S.',
  ruc: '0993456789001',
  iva: '15 %',
  establecimiento: '001',
  puntoEmision: '001',
  diaFacturacion: '1 de cada mes',
  diasPagar: '10',
  direccionMatriz: 'Av. Francisco de Orellana 234, Guayaquil',
  proveedor: '[Por definir]',
};

export const PROVEEDORES_FACTURACION: string[] = ['[Por definir]'];
