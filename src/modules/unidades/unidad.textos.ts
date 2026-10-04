import type { TonoEstado } from '@/components/EstadoBadge.vue';

import type { EstadoUnidad, TipoUnidad } from './services/unidades.service';

export const ESTADOS_UNIDAD: Record<EstadoUnidad, { texto: string; tono: TonoEstado }> = {
  ocupada: { texto: 'Ocupada', tono: 'exito' },
  arrendada: { texto: 'Arrendada', tono: 'info' },
  vacia: { texto: 'Vacía', tono: 'neutro' },
};

export const TIPO_CORTO: Record<TipoUnidad, string> = {
  departamento: 'Depto',
  casa: 'Casa',
  local: 'Local',
  parqueadero: 'Parqueadero',
  bodega: 'Bodega',
};

export const TIPO_LARGO: Record<TipoUnidad, string> = {
  departamento: 'Departamento',
  casa: 'Casa',
  local: 'Local',
  parqueadero: 'Parqueadero',
  bodega: 'Bodega',
};
