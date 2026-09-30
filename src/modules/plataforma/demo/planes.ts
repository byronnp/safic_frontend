// Datos de ejemplo del mockup F6Planes.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface PlanPlataforma {
  clave: string;
  nombre: string;
  condominios: number;
  /** Máximo de usuarios administrativos. */
  usuariosAdministrativos: number;
}

export interface ModuloPlataforma {
  clave: string;
  nombre: string;
  descripcion: string;
  /** El núcleo va en todos los planes y no se puede apagar. */
  siempreIncluido: boolean;
  /** Claves de los planes que incluyen el módulo. */
  planes: string[];
}

export interface AjustesPlanes {
  diasPrueba: string;
  descuentoAnual: string;
  valorUnidadSugerido: string;
}

export const PLANES: PlanPlataforma[] = [
  { clave: 'basico', nombre: 'Básico', condominios: 2, usuariosAdministrativos: 2 },
  { clave: 'profesional', nombre: 'Profesional', condominios: 3, usuariosAdministrativos: 3 },
  { clave: 'completo', nombre: 'Completo', condominios: 2, usuariosAdministrativos: 4 },
];

export const MODULOS_PLATAFORMA: ModuloPlataforma[] = [
  {
    clave: 'nucleo',
    nombre: 'Núcleo',
    descripcion: 'Unidades, residentes, amenidades, roles, importación Excel',
    siempreIncluido: true,
    planes: ['basico', 'profesional', 'completo'],
  },
  {
    clave: 'finanzas',
    nombre: 'Finanzas',
    descripcion: 'Cuotas, pagos, recibos, morosidad, gastos, roles tesorero y contador',
    siempreIncluido: false,
    planes: ['basico', 'profesional', 'completo'],
  },
  {
    clave: 'areas',
    nombre: 'Áreas comunes',
    descripcion: 'Reservas, cobro de uso y garantía, restricción por mora',
    siempreIncluido: false,
    planes: ['profesional', 'completo'],
  },
  {
    clave: 'garita',
    nombre: 'Garita',
    descripcion: 'Visitas con QR, bitácora, paquetería, modo sin conexión',
    siempreIncluido: false,
    planes: ['profesional', 'completo'],
  },
  {
    clave: 'comunicacion',
    nombre: 'Comunicación',
    descripcion: 'Anuncios con lectura, incidencias, notificaciones push',
    siempreIncluido: false,
    planes: ['profesional', 'completo'],
  },
  {
    clave: 'conciliacion',
    nombre: 'Conciliación bancaria automática',
    descripcion: 'Importar estado de cuenta, reglas, cierre de mes',
    siempreIncluido: false,
    planes: ['completo'],
  },
  {
    clave: 'asambleas',
    nombre: 'Asambleas y votaciones',
    descripcion: 'Convocatoria, quórum por alícuota, votación, actas',
    siempreIncluido: false,
    planes: ['completo'],
  },
];

export const AJUSTES_PLANES: AjustesPlanes = {
  diasPrueba: '30',
  descuentoAnual: '10 %',
  valorUnidadSugerido: '$ 2,00',
};
