// Datos de ejemplo del mockup F2MiCuenta.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface MiCuentaCuota {
  id: number;
  mes: string;
  /** Monto en texto decimal, como llega de la API (decimal(12,2)). */
  monto: string;
  vencida: boolean;
  nota: string;
}

export interface MiCuentaRecibo {
  id: number;
  mes: string;
  monto: string;
  numero: string;
  fecha: string;
}

export const MI_CUENTA_ENCABEZADO = 'Jardines del Valle · A-102';

export const MI_CUENTA_CUOTAS: MiCuentaCuota[] = [
  { id: 7, mes: 'Julio 2026', monto: '80.00', vencida: true, nota: 'Vencida el 10 jul' },
  { id: 8, mes: 'Agosto 2026', monto: '80.00', vencida: true, nota: 'Vencida el 10 ago' },
  { id: 9, mes: 'Septiembre 2026', monto: '80.00', vencida: false, nota: 'Vence el 10 oct' },
];

export const MI_CUENTA_RECIBOS: MiCuentaRecibo[] = [
  { id: 358, mes: 'Mayo 2026', monto: '80.00', numero: '000358', fecha: '9 may' },
  { id: 412, mes: 'Junio 2026', monto: '80.00', numero: '000412', fecha: '8 jun' },
];
