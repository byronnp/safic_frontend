// Datos de ejemplo del mockup Guardia.dc.html. Se reemplazan por la API cuando exista el endpoint.
// El guardia solo ve nombre, unidad, teléfono y placas: nunca cédulas ni correos.

export type DirectorioTipoUnidad = 'torre' | 'casa';

export interface DirectorioVehiculo {
  placa: string;
  descripcion: string;
}

export interface DirectorioResidente {
  id: number;
  nombre: string;
  unidad: string;
  tipoUnidad: DirectorioTipoUnidad;
  /** Relación con la unidad y ubicación: "Inquilino · Torre A". */
  relacion: string;
  telefono: string;
  vehiculos: DirectorioVehiculo[];
}

export const DIRECTORIO_TURNO = {
  garita: 'Garita principal',
  turno: 'Turno día',
  guardia: 'Jorge Pazmiño',
};

/** Búsqueda con la que abre el mockup. */
export const DIRECTORIO_BUSQUEDA_INICIAL = 'PBC';

export const DIRECTORIO_RESIDENTES: DirectorioResidente[] = [
  {
    id: 1,
    nombre: 'Diego Mora',
    unidad: 'A-102',
    tipoUnidad: 'torre',
    relacion: 'Inquilino · Torre A',
    telefono: '0983307710',
    vehiculos: [{ placa: 'PBC-4821', descripcion: 'Kia Sportage · Gris' }],
  },
  {
    id: 2,
    nombre: 'Gabriela Torres',
    unidad: 'CS-04',
    tipoUnidad: 'casa',
    relacion: 'Propietaria · Casas',
    telefono: '0990000000',
    vehiculos: [{ placa: 'PBC-1093', descripcion: 'Chevrolet Onix · Blanco' }],
  },
  {
    id: 3,
    nombre: 'Carlos Vega',
    unidad: 'A-201',
    tipoUnidad: 'torre',
    relacion: 'Propietario · Torre A',
    telefono: '0987654321',
    vehiculos: [{ placa: 'PCQ-2210', descripcion: 'Toyota RAV4 · Negro' }],
  },
  {
    id: 4,
    nombre: 'Jorge Cevallos',
    unidad: 'B-306',
    tipoUnidad: 'torre',
    relacion: 'Propietario · Torre B',
    telefono: '0991234567',
    vehiculos: [{ placa: 'PDA-7745', descripcion: 'Hyundai Tucson · Azul' }],
  },
  {
    id: 5,
    nombre: 'Andrea Villacís',
    unidad: 'B-305',
    tipoUnidad: 'torre',
    relacion: 'Inquilina · Torre B',
    telefono: '0979988776',
    vehiculos: [],
  },
  {
    id: 6,
    nombre: 'María Chiluisa',
    unidad: 'C-110',
    tipoUnidad: 'torre',
    relacion: 'Propietaria · Torre C',
    telefono: '0984455667',
    vehiculos: [{ placa: 'PBA-3302', descripcion: 'Suzuki Swift · Rojo' }],
  },
  {
    id: 7,
    nombre: 'Fernando Salazar',
    unidad: 'CS-07',
    tipoUnidad: 'casa',
    relacion: 'Propietario · Casas',
    telefono: '0995566778',
    vehiculos: [
      { placa: 'PCF-9081', descripcion: 'Mazda CX-5 · Plata' },
      { placa: 'IBC-552', descripcion: 'Honda CB190 · Negra' },
    ],
  },
];
