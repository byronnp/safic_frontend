// Datos de ejemplo del mockup F2PagosPorAprobar.dc.html. Se reemplazan por la API cuando exista el endpoint.

export type EstadoValidacionPago = 'coincide' | 'tolerancia' | 'duplicado' | 'monto_no_cubre';
export type NivelValidacion = 'ok' | 'alerta' | 'error';

export interface ValidacionPago {
  texto: string;
  nivel: NivelValidacion;
}

export interface PagoPorAprobar {
  id: number;
  unidad: string;
  pagador: string;
  banco: string;
  /** Fecha de la transferencia, tal como se muestra. */
  fecha: string;
  monto: number;
  cuotas: string;
  estado: EstadoValidacionPago;
  comprobante: string;
  concepto: string;
  validaciones: ValidacionPago[];
}

export const PAGOS_TOLERANCIA_BANCARIA = 0.5;

/** Pagos marcados al abrir la pantalla (como en el mockup). */
export const PAGOS_SELECCIONADOS_INICIALES = [1, 3, 6, 7];

export const PAGOS_POR_APROBAR: PagoPorAprobar[] = [
  {
    id: 1,
    unidad: 'A-102',
    pagador: 'Diego Mora',
    banco: 'Produbanco',
    fecha: '24 sep 2026',
    monto: 160,
    cuotas: 'Jul, Ago',
    estado: 'coincide',
    comprobante: '004518823',
    concepto: 'JV-A102',
    validaciones: [
      { texto: 'Monto igual a 2 cuotas completas ($ 160,00)', nivel: 'ok' },
      { texto: 'Código de unidad JV-A102 en el concepto', nivel: 'ok' },
      { texto: 'N.º de comprobante no registrado antes', nivel: 'ok' },
    ],
  },
  {
    id: 2,
    unidad: 'B-305',
    pagador: 'Andrea Villacís',
    banco: 'Banco Internacional',
    fecha: '24 sep 2026',
    monto: 79.59,
    cuotas: 'Sep',
    estado: 'tolerancia',
    comprobante: '771204596',
    concepto: 'JV-B305',
    validaciones: [
      {
        texto: 'Faltan $ 0,41 para la cuota de $ 80,00: dentro de la tolerancia de $ 0,50',
        nivel: 'alerta',
      },
      {
        texto:
          'Al aprobar, la cuota queda pagada completa y $ 0,41 se registra como diferencia bancaria',
        nivel: 'ok',
      },
      { texto: 'N.º de comprobante no registrado antes', nivel: 'ok' },
    ],
  },
  {
    id: 3,
    unidad: 'CS-07',
    pagador: 'Ramiro Espinosa',
    banco: 'Banco Pichincha',
    fecha: '23 sep 2026',
    monto: 120,
    cuotas: 'Sep',
    estado: 'coincide',
    comprobante: '120093381',
    concepto: 'JV-CS07',
    validaciones: [
      { texto: 'Monto igual a 1 cuota completa ($ 120,00)', nivel: 'ok' },
      { texto: 'Código de unidad en el concepto', nivel: 'ok' },
      { texto: 'N.º de comprobante no registrado antes', nivel: 'ok' },
    ],
  },
  {
    id: 4,
    unidad: 'A-110',
    pagador: 'Pablo Jácome',
    banco: 'Banco Pichincha',
    fecha: '22 sep 2026',
    monto: 80,
    cuotas: 'Sep',
    estado: 'duplicado',
    comprobante: '118830214',
    concepto: 'Alicuota',
    validaciones: [
      { texto: 'Este N.º de comprobante ya se usó en el pago de B-112 del 20 sep', nivel: 'error' },
      { texto: 'No se puede aprobar: rechazar y pedir el comprobante correcto', nivel: 'error' },
    ],
  },
  {
    id: 5,
    unidad: 'C-204',
    pagador: 'Verónica Loor',
    banco: 'Produbanco',
    fecha: '22 sep 2026',
    monto: 100,
    cuotas: 'Ago, Sep',
    estado: 'monto_no_cubre',
    comprobante: '004517702',
    concepto: 'JV-C204',
    validaciones: [
      { texto: 'Eligió 2 cuotas ($ 160,00) pero transfirió $ 100,00', nivel: 'error' },
      {
        texto:
          'No se aceptan cuotas en partes: se puede aplicar a 1 cuota completa (Ago) y dejar $ 20,00 como saldo a favor',
        nivel: 'alerta',
      },
    ],
  },
  {
    id: 6,
    unidad: 'B-112',
    pagador: 'Sofía Andrade',
    banco: 'Banco Pichincha',
    fecha: '21 sep 2026',
    monto: 80,
    cuotas: 'Sep',
    estado: 'coincide',
    comprobante: '118829977',
    concepto: 'JV-B112',
    validaciones: [
      { texto: 'Monto igual a 1 cuota completa ($ 80,00)', nivel: 'ok' },
      { texto: 'N.º de comprobante no registrado antes', nivel: 'ok' },
    ],
  },
  {
    id: 7,
    unidad: 'A-305',
    pagador: 'Luis Benítez',
    banco: 'Banco Internacional',
    fecha: '21 sep 2026',
    monto: 80,
    cuotas: 'Sep',
    estado: 'coincide',
    comprobante: '771203310',
    concepto: 'JV-A305',
    validaciones: [
      { texto: 'Monto igual a 1 cuota completa ($ 80,00)', nivel: 'ok' },
      { texto: 'N.º de comprobante no registrado antes', nivel: 'ok' },
    ],
  },
];
