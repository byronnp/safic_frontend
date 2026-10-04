// Datos de ejemplo del mockup Main.dc.html y UnidadDetalle.dc.html. Se reemplazan por la API cuando exista el endpoint.

import type { TonoEstado } from '@/components/EstadoBadge.vue';

export type EstadoUnidad = 'ocupada' | 'arrendada' | 'vacia';

export interface UnidadDemo {
  codigo: string;
  bloque: string;
  tipo: 'Depto' | 'Casa';
  /** Tipo como se escribe en el detalle ("Departamento"). */
  tipoLargo: string;
  /** Piso (solo departamentos). */
  piso: number | null;
  propietario: string;
  ocupante: string;
  area: string;
  alicuota: string;
  estado: EstadoUnidad;
}

export const ESTADOS_UNIDAD: Record<EstadoUnidad, { texto: string; tono: TonoEstado }> = {
  ocupada: { texto: 'Ocupada', tono: 'exito' },
  arrendada: { texto: 'Arrendada', tono: 'info' },
  vacia: { texto: 'Vacía', tono: 'neutro' },
};

function unidad(
  codigo: string,
  bloque: string,
  tipo: 'Depto' | 'Casa',
  propietario: string,
  ocupante: string,
  area: string,
  alicuota: string,
  estado: EstadoUnidad,
): UnidadDemo {
  const numero = codigo.split('-')[1] ?? '';
  return {
    codigo,
    bloque,
    tipo,
    tipoLargo: tipo === 'Depto' ? 'Departamento' : 'Casa',
    piso: tipo === 'Depto' ? Number(numero.slice(0, numero.length - 2)) : null,
    propietario,
    ocupante,
    area,
    alicuota,
    estado,
  };
}

export const UNIDADES: UnidadDemo[] = [
  unidad(
    'A-101',
    'Torre A',
    'Depto',
    'Carlos Andrade',
    'Carlos Andrade',
    '84 m²',
    '0,62 %',
    'ocupada',
  ),
  unidad(
    'A-102',
    'Torre A',
    'Depto',
    'Lucía Paredes',
    'Diego Mora (inquilino)',
    '84 m²',
    '0,62 %',
    'arrendada',
  ),
  unidad(
    'A-201',
    'Torre A',
    'Depto',
    'Fernando Salazar',
    'Fernando Salazar',
    '96 m²',
    '0,71 %',
    'ocupada',
  ),
  unidad('B-305', 'Torre B', 'Depto', 'Andrea Villacís', '—', '72 m²', '0,53 %', 'vacia'),
  unidad(
    'B-306',
    'Torre B',
    'Depto',
    'Jorge Cevallos',
    'Jorge Cevallos',
    '72 m²',
    '0,53 %',
    'ocupada',
  ),
  unidad(
    'C-110',
    'Torre C',
    'Depto',
    'Inmobiliaria Andina S.A.',
    'Paola Ruiz (inquilina)',
    '110 m²',
    '0,81 %',
    'arrendada',
  ),
  unidad(
    'CS-04',
    'Casas',
    'Casa',
    'Gabriela Torres',
    'Gabriela Torres',
    '180 m²',
    '1,33 %',
    'ocupada',
  ),
  unidad(
    'CS-07',
    'Casas',
    'Casa',
    'Ramiro Espinosa',
    'Ramiro Espinosa',
    '165 m²',
    '1,22 %',
    'ocupada',
  ),
];

// ---------- Detalle de unidad (mockup UnidadDetalle: A-102) ----------

export type EstadoCuenta = 'activa' | 'invitacion' | 'sin-cuenta';

export const ESTADOS_CUENTA: Record<EstadoCuenta, { texto: string; tono: TonoEstado }> = {
  activa: { texto: 'Cuenta activa', tono: 'exito' },
  invitacion: { texto: 'Invitación enviada', tono: 'alerta' },
  'sin-cuenta': { texto: 'Sin cuenta', tono: 'neutro' },
};

export interface OcupanteDemo {
  iniciales: string;
  nombre: string;
  relacion: string;
  desde: string;
  telefono: string;
  documento: string;
  cuenta: EstadoCuenta;
  principal: boolean;
  fondo: string;
  texto: string;
}

export interface VehiculoDemo {
  placa: string;
  descripcion: string;
}

export interface MascotaDemo {
  nombre: string;
  descripcion: string;
}

export interface DocumentoDemo {
  nombre: string;
  detalle: string;
}

export interface EventoDemo {
  fecha: string;
  texto: string;
}

export interface DetalleUnidadDemo {
  ocupantes: OcupanteDemo[];
  vehiculos: VehiculoDemo[];
  mascotas: MascotaDemo[];
  /** Solo unidades arrendadas. */
  contrato: { vigenteHasta: string } | null;
  documentos: DocumentoDemo[];
  historial: EventoDemo[];
}

export const DETALLES_UNIDAD: Record<string, DetalleUnidadDemo> = {
  'A-102': {
    ocupantes: [
      {
        iniciales: 'LP',
        nombre: 'Lucía Paredes',
        relacion: 'Propietaria (no reside)',
        desde: 'mar 2019',
        telefono: '099 481 2203',
        documento: 'C.I. 17xxxxxx89',
        cuenta: 'activa',
        principal: false,
        fondo: '#E6ECF7',
        texto: '#23407A',
      },
      {
        iniciales: 'DM',
        nombre: 'Diego Mora',
        relacion: 'Inquilino',
        desde: 'abr 2025',
        telefono: '098 330 7710',
        documento: 'C.I. 17xxxxxx12',
        cuenta: 'activa',
        principal: true,
        fondo: '#E3EFEC',
        texto: '#0B4A47',
      },
      {
        iniciales: 'SA',
        nombre: 'Sofía Arteaga',
        relacion: 'Residente',
        desde: 'abr 2025',
        telefono: '097 612 5540',
        documento: 'C.I. 17xxxxxx47',
        cuenta: 'invitacion',
        principal: false,
        fondo: '#FFF1DC',
        texto: '#8A3F0A',
      },
      {
        iniciales: 'RM',
        nombre: 'Rosa Mora',
        relacion: 'Contacto de emergencia',
        desde: 'abr 2025',
        telefono: '099 205 1180',
        documento: '—',
        cuenta: 'sin-cuenta',
        principal: false,
        fondo: '#F1EFE8',
        texto: '#4E4A42',
      },
    ],
    vehiculos: [
      { placa: 'PBC-4821', descripcion: 'Kia Sportage · Gris' },
      { placa: 'IB-702A', descripcion: 'Moto Honda · Negra' },
    ],
    mascotas: [{ nombre: 'Luna', descripcion: 'Perro · Golden Retriever' }],
    contrato: { vigenteHasta: '31 mar 2027' },
    documentos: [
      { nombre: 'Contrato de arriendo', detalle: 'PDF · vigente hasta 31 mar 2027' },
      { nombre: 'Escritura de la propiedad', detalle: 'PDF · Lucía Paredes' },
    ],
    historial: [
      { fecha: 'abr 2025', texto: 'Ingresó Diego Mora como inquilino (ocupante principal).' },
      { fecha: 'abr 2025', texto: 'Se registró el contrato de arriendo hasta 31 mar 2027.' },
      { fecha: 'mar 2019', texto: 'Lucía Paredes registrada como propietaria.' },
    ],
  },
};
