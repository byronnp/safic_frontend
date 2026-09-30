// Datos de ejemplo del mockup F3ConfigArea.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface ConfigArea {
  id: string;
  nombre: string;
  resumen: string;
  ubicacion: string;
  abre: string;
  cierra: string;
  duracionMinima: string;
  duracionMaxima: string;
  anticipacionMinima: string;
  anticipacionMaxima: string;
  capacidad: string;
  reservasPorMes: string;
  /** Días habilitados, en orden Lun…Dom */
  dias: boolean[];
  reglamento: string;
  costoUso: string;
  garantia: string;
  requiereAprobacion: boolean;
  restringiblePorMora: boolean;
}

export const DIAS_SEMANA_AREA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

const TODOS = [true, true, true, true, true, true, true];

export const AREAS_CONFIG: ConfigArea[] = [
  {
    id: 'salon',
    nombre: 'Salón comunal',
    resumen: '$ 50 + $ 100 garantía · con aprobación',
    ubicacion: 'Torre A, planta baja',
    abre: '08:00',
    cierra: '23:00',
    duracionMinima: '2 horas',
    duracionMaxima: '6 horas',
    anticipacionMinima: '48 horas',
    anticipacionMaxima: '60 días',
    capacidad: '60 personas',
    reservasPorMes: '1',
    dias: [...TODOS],
    reglamento:
      'Música hasta las 22:00. Entregar el salón limpio y con el mobiliario en su lugar. Máximo 60 personas. Prohibido fumar en el interior.',
    costoUso: '$ 50,00',
    garantia: '$ 100,00',
    requiereAprobacion: true,
    restringiblePorMora: true,
  },
  {
    id: 'bbq1',
    nombre: 'Área BBQ 1',
    resumen: '$ 15 · sin garantía · automática',
    ubicacion: 'Jardín posterior',
    abre: '10:00',
    cierra: '22:00',
    duracionMinima: '2 horas',
    duracionMaxima: '4 horas',
    anticipacionMinima: '24 horas',
    anticipacionMaxima: '30 días',
    capacidad: '15 personas',
    reservasPorMes: '2',
    dias: [...TODOS],
    reglamento:
      'Limpiar la parrilla y retirar la basura al terminar. Máximo 15 personas. No dejar carbón encendido.',
    costoUso: '$ 15,00',
    garantia: '$ 0,00',
    requiereAprobacion: false,
    restringiblePorMora: true,
  },
  {
    id: 'bbq2',
    nombre: 'Área BBQ 2',
    resumen: '$ 15 · sin garantía · automática',
    ubicacion: 'Jardín posterior',
    abre: '10:00',
    cierra: '22:00',
    duracionMinima: '2 horas',
    duracionMaxima: '4 horas',
    anticipacionMinima: '24 horas',
    anticipacionMaxima: '30 días',
    capacidad: '15 personas',
    reservasPorMes: '2',
    dias: [...TODOS],
    reglamento:
      'Limpiar la parrilla y retirar la basura al terminar. Máximo 15 personas. No dejar carbón encendido.',
    costoUso: '$ 15,00',
    garantia: '$ 0,00',
    requiereAprobacion: false,
    restringiblePorMora: true,
  },
  {
    id: 'cancha',
    nombre: 'Cancha múltiple',
    resumen: 'Gratis · máx. 2 h · automática',
    ubicacion: 'Junto al parqueadero de visitas',
    abre: '07:00',
    cierra: '21:00',
    duracionMinima: '1 hora',
    duracionMaxima: '2 horas',
    anticipacionMinima: '2 horas',
    anticipacionMaxima: '7 días',
    capacidad: '20 personas',
    reservasPorMes: '8',
    dias: [...TODOS],
    reglamento: 'Usar calzado deportivo. Respetar el horario reservado y dejar la cancha libre.',
    costoUso: '$ 0,00',
    garantia: '$ 0,00',
    requiereAprobacion: false,
    restringiblePorMora: true,
  },
];
