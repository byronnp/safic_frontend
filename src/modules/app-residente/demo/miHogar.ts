// Datos de ejemplo del mockup Residente.dc.html. Se reemplazan por la API cuando exista el endpoint.

export interface MiHogarUnidad {
  condominio: string;
  saludo: string;
  codigo: string;
  detalle: string;
}

export interface MiHogarPersona {
  id: number;
  nombre: string;
  rol: string;
  esUsuario: boolean;
}

export interface MiHogarVehiculo {
  placa: string;
  descripcion: string;
}

export interface MiHogarMascota {
  nombre: string;
  descripcion: string;
}

export const MI_HOGAR_UNIDAD: MiHogarUnidad = {
  condominio: 'Jardines del Valle',
  saludo: 'Hola, Diego',
  codigo: 'A-102',
  detalle: 'Torre A · Piso 1 · Inquilino',
};

export const MI_HOGAR_PERSONAS: MiHogarPersona[] = [
  { id: 0, nombre: 'Diego Mora', rol: 'Inquilino principal', esUsuario: true },
  { id: 1, nombre: 'Sofía Arteaga', rol: 'Residente', esUsuario: false },
];

export const MI_HOGAR_VEHICULOS: MiHogarVehiculo[] = [
  { placa: 'PBC-4821', descripcion: 'Kia Sportage' },
  { placa: 'IB-702A', descripcion: 'Moto Honda' },
];

export const MI_HOGAR_MASCOTAS: MiHogarMascota[] = [
  { nombre: 'Luna', descripcion: 'Perro · Golden Retriever' },
];
