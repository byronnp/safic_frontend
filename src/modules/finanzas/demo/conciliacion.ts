// Datos de ejemplo del mockup F2Conciliacion.dc.html. Se reemplazan por la API cuando exista el endpoint.

export type PestanaConciliacion = 'auto' | 'sug' | 'sin';

export interface MovimientoBancario {
  id: string;
  /** Fecha del movimiento, tal como se muestra ("02 sep"). */
  fecha: string;
  descripcion: string;
  referencia: string;
  /** Positivo = ingreso, negativo = egreso. */
  monto: number;
  propuesta: string;
  /** Registrado automáticamente (código de unidad, monto exacto o regla). */
  automatico?: boolean;
  accion?: string;
  /** Efecto en el saldo de la app al confirmar (comisiones). */
  efecto?: number;
  textoHecho?: string;
}

export interface CuentaBancaria {
  id: number;
  nombre: string;
}

export interface ArchivoEstadoCuenta {
  nombre: string;
  periodo: string;
  movimientos: number;
  duplicadosDescartados: number;
  saldoInicial: number;
  saldoFinal: number;
  cuadra: boolean;
}

export interface CuadreConciliacion {
  saldoInicial: number;
  pagosResidentes: number;
  intereses: number;
  gastosPagados: number;
  /** Saldo de la app antes de registrar las comisiones pendientes. */
  saldoApp: number;
  saldoBanco: number;
}

export const CONCILIACION_PERIODO = { titulo: 'Septiembre 2026', mes: 'septiembre' };

export const CONCILIACION_CUENTAS: CuentaBancaria[] = [
  { id: 1, nombre: 'Banco Pichincha · Cte. ****4821' },
];

export const CONCILIACION_ARCHIVO: ArchivoEstadoCuenta = {
  nombre: 'estado_cuenta_septiembre.xlsx',
  periodo: '1–30 sep 2026',
  movimientos: 136,
  duplicadosDescartados: 0,
  saldoInicial: 15779.63,
  saldoFinal: 18419,
  cuadra: true,
};

export const CONCILIACION_CUADRE: CuadreConciliacion = {
  saldoInicial: 15779.63,
  pagosResidentes: 9856,
  intereses: 0.37,
  gastosPagados: 7215.4,
  saldoApp: 18420.6,
  saldoBanco: 18419,
};

/** Total de movimientos registrados automáticamente (la lista muestra solo algunos). */
export const CONCILIACION_TOTAL_AUTOMATICOS = 131;

export const CONCILIACION_MOVIMIENTOS: Record<PestanaConciliacion, MovimientoBancario[]> = {
  auto: [
    {
      id: 'a1',
      fecha: '02 sep',
      descripcion: 'TRANSF RECIBIDA JV-A201',
      referencia: '118801245',
      monto: 80,
      propuesta: 'Pago aprobado de A-201 · código y monto exactos',
      automatico: true,
    },
    {
      id: 'a2',
      fecha: '05 sep',
      descripcion: 'PAGO SERV SEGURIDAD PROTEC',
      referencia: '004430112',
      monto: -3450,
      propuesta: 'Gasto registrado · Seguridad',
      automatico: true,
    },
    {
      id: 'a3',
      fecha: '30 sep',
      descripcion: 'INTERES GANADO',
      referencia: '000000930',
      monto: 0.37,
      propuesta: 'Regla: INTERES GANADO → interés',
      automatico: true,
    },
  ],
  sug: [
    {
      id: 's1',
      fecha: '18 sep',
      descripcion: 'TRANSF MORA JIMENEZ D',
      referencia: '004518823',
      monto: 160,
      propuesta: 'Pago aprobado de A-102 (mismo monto y fecha, sin código)',
      accion: 'Vincular',
      efecto: 0,
      textoHecho: 'Vinculado',
    },
    {
      id: 's2',
      fecha: '19 sep',
      descripcion: 'DEP EFECTIVO AG CUMBAYA',
      referencia: '120093381',
      monto: 120,
      propuesta: 'Pago aprobado de CS-07 (mismo monto)',
      accion: 'Vincular',
      efecto: 0,
      textoHecho: 'Vinculado',
    },
    {
      id: 's3',
      fecha: '21 sep',
      descripcion: 'COMISION TRANSF INTERB',
      referencia: '771204596',
      monto: -0.41,
      propuesta: 'Comisión bancaria',
      accion: 'Confirmar',
      efecto: -0.41,
      textoHecho: 'Registrado',
    },
    {
      id: 's4',
      fecha: '24 sep',
      descripcion: 'COMISION TRANSF INTERB',
      referencia: '771204601',
      monto: -0.41,
      propuesta: 'Comisión bancaria',
      accion: 'Confirmar',
      efecto: -0.41,
      textoHecho: 'Registrado',
    },
  ],
  sin: [
    {
      id: 'n1',
      fecha: '30 sep',
      descripcion: 'COSTO MANT CTA CTE',
      referencia: '000000931',
      monto: -0.78,
      propuesta: 'Sin regla · elegir tipo o guardar regla nueva',
      accion: 'Clasificar como comisión',
      efecto: -0.78,
      textoHecho: 'Registrado y regla guardada',
    },
  ],
};
