// Datos de ejemplo del mockup F2CuentasPorPagar.dc.html. Se reemplazan por la API cuando exista el endpoint.

/**
 * pen: por aprobar · n2: falta 2.ª aprobación · apr: aprobada, por pagar ·
 * par: pagada parcial · pag: pagada · rec: rechazada
 */
export type EstadoFactura = 'pen' | 'n2' | 'apr' | 'par' | 'pag' | 'rec';

export interface FacturaProveedor {
  id: number;
  proveedor: string;
  ruc: string;
  categoria: string;
  factura: string;
  /** Vencimiento, tal como se muestra ("05 oct"). */
  vence: string;
  vencida: boolean;
  total: number;
  saldo: number;
  estado: EstadoFactura;
  registradaPor: string;
  nivel1?: string;
  nivel2?: string;
  /** Detalle del pago (pagada parcial o pagada). */
  notaPago?: string;
}

/** Sobre este total la factura necesita la aprobación del presidente o vicepresidente. */
export const CXP_UMBRAL_SEGUNDA_APROBACION = 500;
export const CXP_TARIFA_IVA = 0.15;

export const CXP_PAGADO_MES = {
  mes: 'septiembre',
  monto: 1186,
  nota: 'Conciliado con el banco',
};

export const CXP_FACTURAS: FacturaProveedor[] = [
  {
    id: 1,
    proveedor: 'Seguridad Integral Andina S.A.',
    ruc: '0991234567001',
    categoria: 'Guardianía',
    factura: '001-002-000004512',
    vence: '05 oct',
    vencida: false,
    total: 2760,
    saldo: 2760,
    estado: 'n2',
    registradaPor: 'Jorge Benítez (tesorero) · 22 sep',
    nivel1: 'María Rodríguez · 23 sep',
  },
  {
    id: 2,
    proveedor: 'Limpiezas Galápagos Cía. Ltda.',
    ruc: '0992233445001',
    categoria: 'Limpieza',
    factura: '001-001-000018877',
    vence: '30 sep',
    vencida: false,
    total: 1150,
    saldo: 1150,
    estado: 'apr',
    registradaPor: 'Jorge Benítez (tesorero) · 20 sep',
    nivel1: 'María Rodríguez · 21 sep',
    nivel2: 'Fernando Salazar (presidente) · 21 sep',
  },
  {
    id: 3,
    proveedor: 'CNEL EP',
    ruc: '1768152560001',
    categoria: 'Energía eléctrica',
    factura: '001-100-004455120',
    vence: '28 sep',
    vencida: false,
    total: 412.4,
    saldo: 412.4,
    estado: 'apr',
    registradaPor: 'Jorge Benítez (tesorero) · 19 sep',
    nivel1: 'María Rodríguez · 19 sep',
  },
  {
    id: 4,
    proveedor: 'Ascensores Andinos S.A.',
    ruc: '1790876543001',
    categoria: 'Mantenimiento',
    factura: '001-001-000007902',
    vence: '25 oct',
    vencida: false,
    total: 350,
    saldo: 350,
    estado: 'apr',
    registradaPor: 'Jorge Benítez (tesorero) · 24 sep',
    nivel1: 'María Rodríguez · 24 sep',
  },
  {
    id: 5,
    proveedor: 'Ascensores Andinos S.A.',
    ruc: '1790876543001',
    categoria: 'Mantenimiento',
    factura: '001-001-000007754',
    vence: '20 sep',
    vencida: true,
    total: 1600,
    saldo: 800,
    estado: 'par',
    registradaPor: 'Jorge Benítez (tesorero) · 02 sep',
    nivel1: 'María Rodríguez · 03 sep',
    nivel2: 'Paola Cedeño (vicepresidenta, en subrogación) · 04 sep',
    notaPago: 'Abonado $ 800,00 el 05 sep. Saldo vencido de $ 800,00.',
  },
  {
    id: 6,
    proveedor: 'Ferretería El Constructor',
    ruc: '0990011223001',
    categoria: 'Mantenimiento',
    factura: '002-001-000093310',
    vence: '10 oct',
    vencida: false,
    total: 184,
    saldo: 184,
    estado: 'pen',
    registradaPor: 'Jorge Benítez (tesorero) · 25 sep',
  },
  {
    id: 7,
    proveedor: 'Jardinería Verde Vivo',
    ruc: '0993344556001',
    categoria: 'Áreas verdes',
    factura: '001-001-000002231',
    vence: '15 oct',
    vencida: false,
    total: 240,
    saldo: 240,
    estado: 'pen',
    registradaPor: 'Jorge Benítez (tesorero) · 25 sep',
  },
  {
    id: 8,
    proveedor: 'Interagua',
    ruc: '0992166960001',
    categoria: 'Agua potable',
    factura: '001-003-000512233',
    vence: '18 sep',
    vencida: false,
    total: 386,
    saldo: 0,
    estado: 'pag',
    registradaPor: 'Jorge Benítez (tesorero) · 10 sep',
    nivel1: 'María Rodríguez · 10 sep',
    notaPago: 'Pagada el 16 sep · conciliada con Banco Pichincha.',
  },
];
