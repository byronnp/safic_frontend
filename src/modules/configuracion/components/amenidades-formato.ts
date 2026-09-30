/** Textos derivados de una amenidad (mockup F1AmenidadesCondominio). */
import type { Amenidad } from '../demo/amenidades';

export function usoAmenidad(a: Amenidad): string {
  if (a.esencial) {
    return 'Esencial · no se restringe';
  }
  return a.reservable ? 'Reservable' : 'Uso libre';
}

export function estadoAmenidad(a: Amenidad): string {
  return a.mantenimiento ? `Mantenimiento ${a.mantenimiento}` : 'Disponible';
}

/** "Área BBQ 1" → "ÁB", "Ascensores (3)" → "A", como el mockup: palabras de más de 2 letras o con dígitos, máx. 2. */
export function inicialesAmenidad(nombre: string): string {
  return nombre
    .replace(/\(.*\)/, '')
    .split(' ')
    .filter((w) => w.length > 2 || /\d/.test(w))
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('')
    .slice(0, 2);
}
