// Datos de ejemplo del mockup F2PagoProveedor.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface FacturaPendientePago {
  /** Mismo id de la factura en Cuentas por pagar. */
  id: number;
  factura: string;
  descripcion: string;
  /** Texto del vencimiento, tal como se muestra. */
  vence: string;
  vencida: boolean;
  saldo: number;
}

export interface CuentaProveedor {
  banco: string;
  tipo: string;
  numero: string;
  titular: string;
  ruc: string;
  verificada: string;
}

export interface ProveedorPago {
  id: number;
  nombre: string;
  ruc: string;
  cuenta: CuentaProveedor;
  facturas: FacturaPendientePago[];
}

export interface CuentaOrigen {
  id: number;
  nombre: string;
}

export const PAGO_PROVEEDORES: ProveedorPago[] = [
  {
    id: 1,
    nombre: 'Ascensores Andinos S.A.',
    ruc: '1790876543001',
    cuenta: {
      banco: 'Banco Guayaquil',
      tipo: 'Corriente',
      numero: '0012345678',
      titular: 'Ascensores Andinos S.A.',
      ruc: '1790876543001',
      verificada: '12 mar 2026',
    },
    facturas: [
      {
        id: 5,
        factura: '001-001-000007754',
        descripcion: 'Reparación ascensor torre B',
        vence: 'Venció el 20 sep · abonado $ 800,00',
        vencida: true,
        saldo: 800,
      },
      {
        id: 4,
        factura: '001-001-000007902',
        descripcion: 'Mantenimiento octubre',
        vence: 'Vence el 25 oct',
        vencida: false,
        saldo: 350,
      },
    ],
  },
  {
    id: 2,
    nombre: 'Limpiezas Galápagos Cía. Ltda.',
    ruc: '0992233445001',
    cuenta: {
      banco: 'Banco Pichincha',
      tipo: 'Corriente',
      numero: '2100458871',
      titular: 'Limpiezas Galápagos Cía. Ltda.',
      ruc: '0992233445001',
      verificada: '04 feb 2026',
    },
    facturas: [
      {
        id: 2,
        factura: '001-001-000018877',
        descripcion: 'Limpieza septiembre',
        vence: 'Vence el 30 sep',
        vencida: false,
        saldo: 1150,
      },
    ],
  },
  {
    id: 3,
    nombre: 'CNEL EP',
    ruc: '1768152560001',
    cuenta: {
      banco: 'Banco del Pacífico',
      tipo: 'Corriente',
      numero: '0741236590',
      titular: 'CNEL EP',
      ruc: '1768152560001',
      verificada: '20 ene 2026',
    },
    facturas: [
      {
        id: 3,
        factura: '001-100-004455120',
        descripcion: 'Energía eléctrica septiembre',
        vence: 'Vence el 28 sep',
        vencida: false,
        saldo: 412.4,
      },
    ],
  },
];

export const PAGO_CUENTAS_ORIGEN: CuentaOrigen[] = [
  { id: 1, nombre: 'Banco Pichincha · Corriente ···· 4521' },
  { id: 2, nombre: 'Produbanco · Ahorros ···· 7730' },
];

/** Valores precargados del formulario (como en el mockup). */
export const PAGO_FORMULARIO_INICIAL = {
  fecha: '26/09/2026',
  referencia: '000184530921',
  comprobante: { nombre: 'comprobante-pichincha-26sep.pdf', tamano: '184 KB' },
  siguienteNumero: 'PP-0087',
  bancoConciliacion: 'Banco Pichincha',
};
