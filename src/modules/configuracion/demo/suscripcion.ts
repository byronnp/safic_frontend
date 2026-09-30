// Datos de ejemplo del mockup F6MiSuscripcion.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface FacturaSuscripcion {
  numero: string;
  periodo: string;
  vence: string;
  total: number;
  estado: 'Pagada';
}

export interface CuentaBancaria {
  banco: string;
  tipo: string;
  numero: string;
  titular: string;
  ruc: string;
}

export interface Suscripcion {
  plan: string;
  modulos: string;
  unidadesRegistradas: number;
  unidadesLimite: number;
  usuariosAdministrativos: number;
  usuariosLimite: number;
  usuariosDetalle: string;
  precioPorUnidad: number;
  iva: number;
  codigoCliente: string;
  unidadesSolicitudSugerida: number;
}

export const SUSCRIPCION: Suscripcion = {
  plan: 'Profesional',
  modulos: 'Finanzas, áreas comunes, garita, comunicación',
  unidadesRegistradas: 148,
  unidadesLimite: 148,
  usuariosAdministrativos: 3,
  usuariosLimite: 3,
  usuariosDetalle: 'Admin, tesorero y contadora',
  precioPorUnidad: 2.5,
  iva: 0.15,
  codigoCliente: 'CA-0001',
  unidadesSolicitudSugerida: 160,
};

export const FACTURAS: FacturaSuscripcion[] = [
  {
    numero: '001-001-000299',
    periodo: 'Octubre 2026',
    vence: '11 oct',
    total: 425.5,
    estado: 'Pagada',
  },
  {
    numero: '001-001-000265',
    periodo: 'Septiembre 2026',
    vence: '11 sep',
    total: 425.5,
    estado: 'Pagada',
  },
  {
    numero: '001-001-000228',
    periodo: 'Agosto 2026',
    vence: '11 ago',
    total: 425.5,
    estado: 'Pagada',
  },
  {
    numero: '001-001-000194',
    periodo: 'Julio 2026',
    vence: '11 jul',
    total: 425.5,
    estado: 'Pagada',
  },
];

export const CUENTAS_BANCARIAS: CuentaBancaria[] = [
  {
    banco: 'Banco Pichincha',
    tipo: 'Corriente',
    numero: '2100458812',
    titular: 'SAFIC S.A.S.',
    ruc: '0993456789001',
  },
  {
    banco: 'Produbanco',
    tipo: 'Ahorros',
    numero: '12006543021',
    titular: 'SAFIC S.A.S.',
    ruc: '0993456789001',
  },
];
