// Datos de ejemplo del mockup F1CatalogoAmenidades.dc.html. Se reemplazan por la API cuando exista el endpoint.

export type CategoriaAmenidad = 'rec' | 'dep' | 'soc' | 'ser' | 'seg';

export const CATEGORIAS_AMENIDAD: Record<CategoriaAmenidad, { nombre: string; color: string }> = {
  rec: { nombre: 'Recreación', color: '#0E5E5B' },
  dep: { nombre: 'Deporte', color: '#23407A' },
  soc: { nombre: 'Social', color: '#B8641C' },
  ser: { nombre: 'Servicios', color: '#5F5B52' },
  seg: { nombre: 'Seguridad', color: '#7A2E5A' },
};

export interface AmenidadCatalogo {
  id: number;
  nombre: string;
  categoria: CategoriaAmenidad;
  descripcion: string;
  reservable: boolean;
  esencial: boolean;
  requiereAprobacion: boolean;
  activa: boolean;
  /** Capacidad sugerida (0 = no aplica). */
  capacidad: number;
  /** Duración máxima sugerida ('—' = no aplica). */
  duracion: string;
  orden: number;
  /** Catálogo global: cuántos condominios la usan. */
  uso: number;
  /** Amenidad propia: condominio que la creó. */
  condominio: string;
}

function a(
  id: number,
  nombre: string,
  categoria: CategoriaAmenidad,
  descripcion: string,
  [r, e, ap, act]: [number, number, number, number],
  capacidad: number,
  duracion: string,
  uso: number,
  condominio = '',
): AmenidadCatalogo {
  return {
    id,
    nombre,
    categoria,
    descripcion,
    reservable: r === 1,
    esencial: e === 1,
    requiereAprobacion: ap === 1,
    activa: act === 1,
    capacidad,
    duracion,
    orden: 0,
    uso,
    condominio,
  };
}

function ordenar(lista: AmenidadCatalogo[]): AmenidadCatalogo[] {
  return lista.map((x, i) => ({ ...x, orden: i + 1 }));
}

export const AMENIDADES_GLOBALES: AmenidadCatalogo[] = ordenar([
  a(1, 'Piscina', 'rec', 'Piscina de uso común con horario', [1, 0, 0, 1], 30, '3 h', 5),
  a(2, 'Salón comunal', 'soc', 'Eventos sociales y reuniones', [1, 0, 1, 1], 80, '6 h', 6),
  a(3, 'Área BBQ', 'soc', 'Parrilla con mesas', [1, 0, 0, 1], 20, '4 h', 6),
  a(4, 'Cancha múltiple', 'dep', 'Fútbol, básquet o vóley', [1, 0, 0, 1], 12, '2 h', 4),
  a(5, 'Gimnasio', 'dep', 'Máquinas y pesas, uso libre', [0, 0, 0, 1], 15, '—', 4),
  a(6, 'Parque infantil', 'rec', 'Juegos para niños', [0, 0, 0, 1], 0, '—', 5),
  a(7, 'Ascensor', 'ser', 'Transporte vertical', [0, 1, 0, 1], 0, '—', 3),
  a(8, 'Generador eléctrico', 'ser', 'Respaldo de energía', [0, 1, 0, 1], 0, '—', 4),
  a(9, 'Guardianía 24 h', 'seg', 'Control de acceso permanente', [0, 1, 0, 1], 0, '—', 7),
  a(10, 'Sauna y turco', 'rec', 'Sin uso por ahora', [1, 0, 1, 0], 6, '1 h', 0),
]);

export const AMENIDADES_PROPIAS: AmenidadCatalogo[] = ordenar([
  a(
    101,
    'Muelle',
    'rec',
    'Embarcadero para botes pequeños',
    [1, 0, 1, 1],
    4,
    '4 h',
    0,
    'Brisas del Mar',
  ),
  a(
    102,
    'Huerto comunitario',
    'rec',
    'Parcelas de siembra por familia',
    [0, 0, 0, 1],
    0,
    '—',
    0,
    'Jardines del Valle',
  ),
  a(
    103,
    'Sala de cowork',
    'soc',
    'Escritorios y wifi',
    [1, 0, 0, 1],
    10,
    '4 h',
    0,
    'Parque Samborondón',
  ),
]);
