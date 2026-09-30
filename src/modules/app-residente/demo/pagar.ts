// Datos de ejemplo del mockup F2Pagar.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface PagarCuota {
  mes: string;
  nota: string;
  vencida: boolean;
  /** Monto en texto decimal, como llega de la API (decimal(12,2)). */
  monto: string;
}

export interface PagarCuentaBancaria {
  banco: string;
  numero: string;
  titular: string;
  /** Código que el residente escribe en el concepto de la transferencia. */
  concepto: string;
}

/** Cuotas pendientes, de la más antigua a la más reciente. */
export const PAGAR_CUOTAS: PagarCuota[] = [
  { mes: 'Julio 2026', nota: 'Vencida', vencida: true, monto: '80.00' },
  { mes: 'Agosto 2026', nota: 'Vencida', vencida: true, monto: '80.00' },
  { mes: 'Septiembre 2026', nota: 'Vence el 10 oct', vencida: false, monto: '80.00' },
];

/** Cuántas cuotas vienen marcadas al abrir la pantalla. */
export const PAGAR_SELECCION_INICIAL = 2;

export const PAGAR_CUENTA: PagarCuentaBancaria = {
  banco: 'Banco Pichincha · Cta. corriente',
  numero: '[N.º DE CUENTA]',
  titular: 'Condominio Jardines del Valle',
  concepto: 'JV-A102',
};

export const PAGAR_COMPROBANTE_INICIAL = '004518823';
