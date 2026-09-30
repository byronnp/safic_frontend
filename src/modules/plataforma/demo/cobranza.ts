// Datos de ejemplo del mockup F6Cobranza.dc.html. Se reemplazan por la API cuando exista el endpoint.

export type EstadoPagoCobranza = 'al_dia' | 'por_aprobar' | 'pendiente' | 'vencido' | 'prueba';
export type EstadoSuscripcionCobranza = 'activa' | 'prueba' | 'suspendida';

export interface CondominioCobranza {
  id: number;
  nombre: string;
  codigo: string;
  plan: string;
  unidades: number;
  valorUnidad: number;
  /** Factura del mes con IVA; null cuando está en prueba. */
  factura: number | null;
  estadoPago: EstadoPagoCobranza;
  /** Texto del estado cuando depende de la fecha ("Pendiente · vence 11 oct"). */
  estadoPagoTexto: string;
  saldo: number;
  suscripcion: EstadoSuscripcionCobranza;
}

export interface ResumenCobranza {
  periodo: string;
  ingresoRecurrente: number;
  condominiosActivos: number;
  facturadoMes: number;
  cobrado: number;
  /** Porcentaje cobrado sobre lo facturado (0–100). */
  porcentajeCobrado: number;
  porAprobarCantidad: number;
  porAprobarMonto: number;
  porAprobarCondominio: string;
  carteraVencida: number;
  condominiosSuspendidos: number;
}

export const RESUMEN_COBRANZA: ResumenCobranza = {
  periodo: 'Octubre 2026',
  ingresoRecurrente: 1560,
  condominiosActivos: 5,
  facturadoMes: 1794,
  cobrado: 1150,
  porcentajeCobrado: 64,
  porAprobarCantidad: 1,
  porAprobarMonto: 299,
  porAprobarCondominio: 'Conjunto Los Arupos',
  carteraVencida: 262.2,
  condominiosSuspendidos: 1,
};

export const CONDOMINIOS_COBRANZA: CondominioCobranza[] = [
  {
    id: 5,
    nombre: 'Parque Samborondón',
    codigo: 'CA-0005',
    plan: 'Completo',
    unidades: 210,
    valorUnidad: 3,
    factura: 724.5,
    estadoPago: 'al_dia',
    estadoPagoTexto: 'Al día',
    saldo: 0,
    suscripcion: 'activa',
  },
  {
    id: 1,
    nombre: 'Jardines del Valle',
    codigo: 'CA-0001',
    plan: 'Profesional',
    unidades: 148,
    valorUnidad: 2.5,
    factura: 425.5,
    estadoPago: 'al_dia',
    estadoPagoTexto: 'Al día',
    saldo: 0,
    suscripcion: 'activa',
  },
  {
    id: 12,
    nombre: 'Conjunto Los Arupos',
    codigo: 'CA-0012',
    plan: 'Profesional',
    unidades: 130,
    valorUnidad: 2,
    factura: 299,
    estadoPago: 'por_aprobar',
    estadoPagoTexto: 'Pago por aprobar',
    saldo: 299,
    suscripcion: 'activa',
  },
  {
    id: 2,
    nombre: 'Torres del Mirador',
    codigo: 'CA-0002',
    plan: 'Profesional',
    unidades: 96,
    valorUnidad: 2.5,
    factura: 276,
    estadoPago: 'pendiente',
    estadoPagoTexto: 'Pendiente · vence 11 oct',
    saldo: 276,
    suscripcion: 'activa',
  },
  {
    id: 3,
    nombre: 'Los Arrayanes',
    codigo: 'CA-0003',
    plan: 'Básico',
    unidades: 30,
    valorUnidad: 2,
    factura: 69,
    estadoPago: 'pendiente',
    estadoPagoTexto: 'Pendiente · vence 11 oct',
    saldo: 69,
    suscripcion: 'activa',
  },
  {
    id: 11,
    nombre: 'Brisas del Mar',
    codigo: 'CA-0011',
    plan: 'Completo',
    unidades: 72,
    valorUnidad: 2,
    factura: null,
    estadoPago: 'prueba',
    estadoPagoTexto: 'En prueba',
    saldo: 0,
    suscripcion: 'prueba',
  },
  {
    id: 6,
    nombre: 'Residencial El Cedro',
    codigo: 'CA-0006',
    plan: 'Básico',
    unidades: 38,
    valorUnidad: 2,
    factura: 87.4,
    estadoPago: 'vencido',
    estadoPagoTexto: 'Vencido 42 días',
    saldo: 262.2,
    suscripcion: 'suspendida',
  },
];
